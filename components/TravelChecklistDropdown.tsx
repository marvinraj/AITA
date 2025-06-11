import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// define types for checklist items and checklists
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// define the structure of a checklist
interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

// utility function to generate unique IDs
function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TravelChecklistDropdown() {
  // state variables to manage the dropdown, checklists, active checklist index, and input values
  const [open, setOpen] = useState(false);
  // state for the list of checklists
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  // state for the currently active checklist index
  const [activeIdx, setActiveIdx] = useState(0);
  // state for the new checklist name input
  const [newChecklistName, setNewChecklistName] = useState('');
  // state for the new item input
  const [newItem, setNewItem] = useState('');

  // add a new checklist
  const addChecklist = () => {
    if (newChecklistName.trim()) {
      setChecklists([{ id: uuid(), name: newChecklistName, items: [] }, ...checklists]);
      setActiveIdx(0);
      setNewChecklistName('');
    }
  };

  // delete a checklist
  const deleteChecklist = (idx: number) => {
    const updated = checklists.filter((_, i) => i !== idx);
    setChecklists(updated);
    setActiveIdx(Math.max(0, idx - 1));
  };

  // add item to active checklist
  const addItem = () => {
    if (!newItem.trim() || !checklists[activeIdx]) return;
    const updated = [...checklists];
    updated[activeIdx].items = [
      { id: uuid(), text: newItem, checked: false },
      ...updated[activeIdx].items,
    ];
    setChecklists(updated);
    setNewItem('');
  };

  // toggle item checked
  const toggleItem = (itemIdx: number) => {
    const updated = [...checklists];
    updated[activeIdx].items[itemIdx].checked = !updated[activeIdx].items[itemIdx].checked;
    setChecklists(updated);
  };

  // delete item
  const deleteItem = (itemIdx: number) => {
    const updated = [...checklists];
    updated[activeIdx].items = updated[activeIdx].items.filter((_, i) => i !== itemIdx);
    setChecklists(updated);
  };

  return (
    <View className="mb-3 w-full">
      <TouchableOpacity onPress={() => setOpen(!open)} className="flex-row justify-between items-center px-4 py-3 rounded-2xl border border-[#35345a]">
        <Text className="text-primaryFont text-base font-InterBold">Travel Checklist</Text>
        <Text className="text-primaryFont text-xl">{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View className="px-2 py-3 rounded-b-2xl">
          {/* add checklist */}
          <View className="flex-row items-center mb-4">
            <TextInput
              className="flex-1 bg-[#23223a] text-primaryFont px-4 py-2 rounded-full border border-[#35345a] mr-2 text-sm"
              placeholder="New checklist name..."
              placeholderTextColor="#828282"
              value={newChecklistName}
              onChangeText={setNewChecklistName}
              maxLength={40}
            />
            <Pressable onPress={addChecklist} className="bg-accentFont rounded-full px-4 py-2 active:opacity-80 shadow">
              <Text className="text-white font-bold text-base">+</Text>
            </Pressable>
          </View>
          {/* checklist tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
            {checklists.map((c, idx) => (
              <View key={c.id} className="flex-row items-center mr-2">
                <Pressable
                  onPress={() => setActiveIdx(idx)}
                  className={
                    (activeIdx === idx
                      ? 'bg-accentFont shadow-lg'
                      : 'bg-[#35345a]') +
                    ' px-5 py-2 rounded-full mr-1 transition-all duration-200'
                  }
                >
                  <Text className="text-white text-sm font-bold">{c.name}</Text>
                </Pressable>
                <Pressable onPress={() => deleteChecklist(idx)} className="px-2 py-1 rounded-full bg-red-600 active:opacity-80 ml-1">
                  <Text className="text-white text-xs">✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {/* checklist items */}
          {checklists.length === 0 ? (
            <Text className="text-secondaryFont text-center mt-2">No checklists yet. Add your first checklist!</Text>
          ) : (
            <>
              {/* add item */}
              <View className="flex-row items-center mb-4">
                <TextInput
                  className="flex-1 bg-[#23223a] text-primaryFont px-4 py-2 rounded-full border border-[#35345a] mr-2 text-sm"
                  placeholder="Add an item..."
                  placeholderTextColor="#828282"
                  value={newItem}
                  onChangeText={setNewItem}
                  maxLength={60}
                />
                <Pressable onPress={addItem} className="bg-accentFont rounded-full px-4 py-2 active:opacity-80 shadow">
                  <Text className="text-white font-bold text-base">+</Text>
                </Pressable>
              </View>
              {/* items list */}
              {checklists[activeIdx]?.items.length === 0 ? (
                <Text className="text-secondaryFont text-center mt-2">No items yet. Add your first item!</Text>
              ) : (
                <View className="space-y-2">
                  {checklists[activeIdx].items.map((item, idx) => (
                    <View key={item.id} className="flex-row items-center bg-[#23223a] rounded-full px-4 py-2">
                      <Pressable
                        onPress={() => toggleItem(idx)}
                        className="mr-3"
                      >
                        <Text className={item.checked ? 'text-green-400 text-lg' : 'text-gray-400 text-lg'}>
                          {item.checked ? '☑️' : '⬜'}
                        </Text>
                      </Pressable>
                      <Text className={
                        'flex-1 text-primaryFont text-sm' +
                        (item.checked ? ' line-through text-secondaryFont' : '')
                      }>
                        {item.text}
                      </Text>
                      <Pressable onPress={() => deleteItem(idx)} className="px-2 py-1 rounded-full bg-red-600 active:opacity-80 ml-2">
                        <Text className="text-white text-xs">Delete</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
