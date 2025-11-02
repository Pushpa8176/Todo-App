// Handles offline caching and sync logic
// src/utils/offline.js
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

const db = SQLite.openDatabase('todos.db');

export function initLocalDB() {
  db.transaction(tx => {
    tx.executeSql(
      `create table if not exists todos_local (
        id text primary key not null,
        user_id text,
        group_id text,
        title text,
        description text,
        is_completed int,
        synced int default 0,
        created_at text,
        updated_at text
      );`
    );
    tx.executeSql(
      `create table if not exists groups_local (
        id text primary key not null,
        user_id text,
        name text,
        created_at text
      );`
    );
    tx.executeSql(
      `create table if not exists queue (
        id integer primary key autoincrement,
        op_type text,
        table_name text,
        record_id text,
        payload text,
        created_at text
      );`
    );
  }, (err)=> console.error('init db err', err));
}

function runSqlAsync(sql, args = []) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(sql, args, (_, result) => resolve(result), (_, err) => reject(err));
    });
  });
}

export async function getLocalTodos(userId) {
  const res = await runSqlAsync(
    `select * from todos_local where user_id = ? order by is_completed asc, datetime(created_at) desc`,
    [userId]
  );
  const items = [];
  for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i));
  return items;
}

export async function getLocalGroups(userId) {
  const res = await runSqlAsync(
    `select * from groups_local where user_id = ? order by datetime(created_at) desc`,
    [userId]
  );
  const items = [];
  for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i));
  return items;
}

async function enqueue(op_type, table_name, record_id, payload) {
  const now = new Date().toISOString();
  await runSqlAsync(
    `insert into queue (op_type, table_name, record_id, payload, created_at) values (?, ?, ?, ?, ?)`,
    [op_type, table_name, record_id, JSON.stringify(payload), now]
  );
}

export async function addLocalTodo({ user_id, group_id, title, description }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  await runSqlAsync(
    `insert into todos_local (id, user_id, group_id, title, description, is_completed, synced, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, user_id, group_id, title, description || '', 0, 0, now, now]
  );
  await enqueue('INSERT', 'todos', id, {
    id,
    user_id,
    group_id,
    title,
    description,
    is_completed: false,
    created_at: now,
    updated_at: now
  });
  return id;
}

export async function toggleLocalTodo(id, user_id, is_completed) {
  const now = new Date().toISOString();
  await runSqlAsync(
    `update todos_local set is_completed = ?, synced = 0, updated_at = ? where id = ? and user_id = ?`,
    [is_completed ? 1 : 0, now, id, user_id]
  );
  await enqueue('UPDATE', 'todos', id, { id, is_completed: !!is_completed, updated_at: now });
}

export async function deleteLocalTodo(id, user_id) {
  await runSqlAsync(`delete from todos_local where id = ? and user_id = ?`, [id, user_id]);
  await enqueue('DELETE', 'todos', id, { id });
}

// Groups
export async function addLocalGroup({ user_id, name }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  await runSqlAsync(`insert into groups_local (id, user_id, name, created_at) values (?, ?, ?, ?)`, [id, user_id, name, now]);
  await enqueue('INSERT', 'groups', id, { id, user_id, name, created_at: now });
  return id;
}

export async function renameLocalGroup(id, user_id, name) {
  await runSqlAsync(`update groups_local set name = ? where id = ? and user_id = ?`, [name, id, user_id]);
  await enqueue('UPDATE', 'groups', id, { id, name, updated_at: new Date().toISOString() });
}

export async function deleteLocalGroup(id, user_id) {
  await runSqlAsync(`delete from groups_local where id = ? and user_id = ?`, [id, user_id]);
  await enqueue('DELETE', 'groups', id, { id });
}

// Sync function (drain queue and apply changes to Supabase)
export async function syncWithServer(supabase, userId) {
  // 🔹 1. Fetch unsynced todos before queue drain
  const unsyncedRes = await runSqlAsync(`select * from todos_local where synced = 0`);
  const unsyncedTodos = [];
  for (let i = 0; i < unsyncedRes.rows.length; i++) unsyncedTodos.push(unsyncedRes.rows.item(i));

  // Push unsynced todos to server
  for (let todo of unsyncedTodos) {
    try {
      await supabase.from('todos').upsert(todo);
      await runSqlAsync(`update todos_local set synced = 1 where id = ?`, [todo.id]);
    } catch (err) {
      console.error('Failed to sync todo', todo.id, err);
    }
  }

  // 🔹 2. Process queued operations
  const qRes = await runSqlAsync(`select * from queue order by id asc`);
  const ops = [];
  for (let i = 0; i < qRes.rows.length; i++) ops.push(qRes.rows.item(i));

  for (let op of ops) {
    try {
      const payload = JSON.parse(op.payload);
      if (op.table_name === 'todos') {
        if (op.op_type === 'INSERT') {
          await supabase.from('todos').upsert(payload);
        } else if (op.op_type === 'UPDATE') {
          await supabase.from('todos').update(payload).eq('id', op.record_id);
        } else if (op.op_type === 'DELETE') {
          await supabase.from('todos').delete().eq('id', op.record_id);
        }
      } else if (op.table_name === 'groups') {
        if (op.op_type === 'INSERT') {
          await supabase.from('groups').upsert(payload);
        } else if (op.op_type === 'UPDATE') {
          await supabase.from('groups').update(payload).eq('id', op.record_id);
        } else if (op.op_type === 'DELETE') {
          await supabase.from('groups').delete().eq('id', op.record_id);
        }
      }

      // delete queue row
      await runSqlAsync(`delete from queue where id = ?`, [op.id]);
    } catch (err) {
      console.error('sync op failed', op, err);
    }
  }

  // 🔹 3. Pull latest data from server and merge locally
  const { data: serverTodos, error: todosErr } = await supabase.from('todos').select('*').eq('user_id', userId);
  const { data: serverGroups, error: groupsErr } = await supabase.from('groups').select('*').eq('user_id', userId);

  if (!todosErr && serverTodos) {
    for (let t of serverTodos) {
      const local = await runSqlAsync(`select * from todos_local where id = ?`, [t.id]);
      if (local.rows.length === 0) {
        await runSqlAsync(
          `insert into todos_local (id, user_id, group_id, title, description, is_completed, synced, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.user_id, t.group_id, t.title, t.description || '', t.is_completed ? 1 : 0, 1, t.created_at, t.updated_at || t.created_at]
        );
      } else {
        const localRow = local.rows.item(0);
        const localUpdated = new Date(localRow.updated_at || localRow.created_at).getTime();
        const remoteUpdated = new Date(t.updated_at || t.created_at).getTime();
        if (remoteUpdated >= localUpdated) {
          await runSqlAsync(
            `update todos_local set group_id=?, title=?, description=?, is_completed=?, synced=?, created_at=?, updated_at=? where id=?`,
            [t.group_id, t.title, t.description || '', t.is_completed ? 1 : 0, 1, t.created_at, t.updated_at || t.created_at, t.id]
          );
        } else {
          await enqueue('UPDATE', 'todos', t.id, {
            id: t.id,
            user_id: t.user_id,
            group_id: localRow.group_id,
            title: localRow.title,
            description: localRow.description,
            is_completed: !!localRow.is_completed,
            created_at: localRow.created_at,
            updated_at: localRow.updated_at
          });
        }
      }
    }
  }

  if (!groupsErr && serverGroups) {
    for (let g of serverGroups) {
      const local = await runSqlAsync(`select * from groups_local where id = ?`, [g.id]);
      if (local.rows.length === 0) {
        await runSqlAsync(`insert into groups_local (id, user_id, name, created_at) values (?, ?, ?, ?)`, [g.id, g.user_id, g.name, g.created_at]);
      } else {
        await runSqlAsync(`update groups_local set name = ?, created_at = ? where id = ?`, [g.name, g.created_at, g.id]);
      }
    }
  }
}

export async function getLocalTodos() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        "select * from todos_local",
        [],
        (_, { rows }) => resolve(rows._array),
        (_, err) => reject(err)
      );
    });
  });
}
