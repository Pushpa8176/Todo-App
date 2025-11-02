// Individual to-do item component
// src/components/TodoItem.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function TodoItem({ item, onToggle, onDelete }) {
  return (
    <View style={{
      padding:12, marginVertical:6, backgroundColor:'#fff', borderRadius:8, shadowColor:'#000', shadowOpacity:0.03,
      flexDirection:'row', alignItems:'center', justifyContent:'space-between'
    }}>
      <TouchableOpacity style={{flex:1}} onPress={()=>onToggle(item)}>
        <Text style={{textDecorationLine: item.is_completed ? 'line-through' : 'none', fontSize:16}}>{item.title}</Text>
        {item.description ? <Text style={{color:'#666', marginTop:4}}>{item.description}</Text> : null}
      </TouchableOpacity>
      <View style={{marginLeft:12}}>
        <TouchableOpacity onPress={()=>onDelete(item)} style={{padding:6}}>
          <Text style={{color:'red'}}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
