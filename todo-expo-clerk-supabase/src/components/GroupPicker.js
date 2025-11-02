// Dropdown or modal to select groups
// src/components/GroupPicker.js
import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { View } from 'react-native';

export default function GroupPicker({ groups, selectedGroupId, onChange }) {
  return (
    <View style={{borderWidth:1,borderColor:'#eee',borderRadius:6,overflow:'hidden'}}>
      <Picker
        selectedValue={selectedGroupId}
        onValueChange={(v)=>onChange(v)}
      >
        {groups.map(g => (
          <Picker.Item key={g.id} label={g.name} value={g.id} />
        ))}
      </Picker>
    </View>
  );
}
