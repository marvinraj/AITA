import { useState } from 'react';
import { Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TravelChecklistCard() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'addChecklist' | 'addItem' | 'editItem' | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editItemIdx, setEditItemIdx] = useState<number | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [menuIdx, setMenuIdx] = useState<number | null>(null);
  // state for which item is being edited
  const [editingItemIdx, setEditingItemIdx] = useState<{ checklistIdx: number, itemIdx: number } | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Add checklist
  const handleAddChecklist = () => {
    if (newChecklistName.trim()) {
      setChecklists([{ id: uuid(), name: newChecklistName, items: [] }, ...checklists]);
      setActiveIdx(0);
      setNewChecklistName('');
      setModalVisible(false);
      setModalType(null);
    }
  };

  // Delete checklist
  const deleteChecklist = (idx: number) => {
    const updated = checklists.filter((_, i) => i !== idx);
    setChecklists(updated);
    setActiveIdx(Math.max(0, idx - 1));
  };

  // Add item
  const handleAddItem = () => {
    if (!newItem.trim() || !checklists[activeIdx]) return;
    const updated = [...checklists];
    updated[activeIdx].items = [
      { id: uuid(), text: newItem, checked: false },
      ...updated[activeIdx].items,
    ];
    setChecklists(updated);
    setNewItem('');
    setModalVisible(false);
    setModalType(null);
  };

  // Edit item
  const handleEditItem = () => {
    if (editItemIdx === null || !editItemText.trim()) return;
    const updated = [...checklists];
    updated[activeIdx].items[editItemIdx].text = editItemText;
    setChecklists(updated);
    setEditItemIdx(null);
    setEditItemText('');
    setModalVisible(false);
    setModalType(null);
  };

  // Toggle item checked
  const toggleItem = (itemIdx: number) => {
    const updated = [...checklists];
    updated[activeIdx].items[itemIdx].checked = !updated[activeIdx].items[itemIdx].checked;
    setChecklists(updated);
  };

  // Delete item
  const deleteItem = (itemIdx: number) => {
    const updated = [...checklists];
    updated[activeIdx].items = updated[activeIdx].items.filter((_, i) => i !== itemIdx);
    setChecklists(updated);
    setMenuIdx(null);
  };

  // Open modal for add/edit
  const openModal = (type: 'addChecklist' | 'addItem' | 'editItem', idx?: number) => {
    setModalType(type);
    setModalVisible(true);
    if (type === 'editItem' && typeof idx === 'number') {
      setEditItemIdx(idx);
      setEditItemText(checklists[activeIdx].items[idx].text);
    } else if (type === 'addItem') {
      setNewItem('');
    } else if (type === 'addChecklist') {
      setNewChecklistName('');
    }
  };

  return (
    <View className="w-full">
      {/* Checklist title and add checklist button */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-primaryFont text-xl font-UrbanistSemiBold">Travel Checklist</Text>
        <Pressable
          onPress={() => openModal('addChecklist')}
          className="bg-transparent px-3 py-2"
        >
          <Image source={require('../assets/icons/add.png')} style={{ width: 18, height: 18, tintColor: 'white' }} />
        </Pressable>
      </View>
      {/* Each checklist as a card */}
      {checklists.length === 0 ? (
        <Text className="text-secondaryFont text-center mt-4 mb-4">No checklists yet. Add your first checklist!</Text>
      ) : (
        <View className="flex flex-col gap-y-4 w-full">
          {checklists.map((c, idx) => (
            <View key={c.id} className="w-full bg-buttonPrimaryBG rounded-2xl px-4 py-5 shadow-md">
              {/* Checklist name and delete button */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className={"text-primaryFont text-base font-InterBold" + (activeIdx === idx ? '' : ' opacity-70')}>{c.name}</Text>
                <Pressable onPress={() => deleteChecklist(idx)} className="px-2 py-1 rounded-full bg-red-900 active:opacity-80 ml-1">
                  <Text className="text-white text-xs">✕</Text>
                </Pressable>
              </View>
              {/* Add item input for this checklist */}
              <View className="w-full bg- rounded-xl px-2 py-2 flex-row items-center mb-3">
                <TextInput
                  className="flex-1 bg-transparent text-primaryFont text-sm font-InterRegular"
                  placeholder="Add an item..."
                  placeholderTextColor="#828282"
                  value={activeIdx === idx ? newItem : ''}
                  onChangeText={val => { if (activeIdx === idx) setNewItem(val); }}
                  maxLength={60}
                  onSubmitEditing={() => { if (activeIdx === idx) handleAddItem(); }}
                  returnKeyType="done"
                />
                {/* <Pressable onPress={() => { if (activeIdx === idx) handleAddItem(); }} className="px-2 py-1 rounded bg-accentFont active:opacity-80">
                  <Text className="text-white text-xs">Add</Text>
                </Pressable> */}
              </View>
              {/* Checklist items */}
              {c.items.length === 0 ? (
                <Text className="text-secondaryFont font-InterRegular text-center mt-2">No items yet. Add your first item!</Text>
              ) : (
                <View className="flex flex-col gap-y-2 w-full">
                  {c.items.map((item, itemIdx) => (
                    <View
                      key={item.id}
                      className="w-full rounded-xl px-4 flex-row items-center relative"
                    >
                      <Pressable onPress={() => { setActiveIdx(idx); toggleItem(itemIdx); }} className="mr-3" hitSlop={10}>
                        <Text className={item.checked ? 'text-green-400 text-lg' : 'text-gray-400 text-lg'}>
                          {item.checked ? '☑️' : '⬜'}
                        </Text>
                      </Pressable>
                      {editingItemIdx && editingItemIdx.checklistIdx === idx && editingItemIdx.itemIdx === itemIdx ? (
                        <TextInput
                          className="flex-1 bg-transparent font-InterRegular text-primaryFont text-sm mr-2"
                          value={editingItemText}
                          onChangeText={setEditingItemText}
                          autoFocus
                          maxLength={60}
                          onSubmitEditing={() => {
                            const updated = [...checklists];
                            updated[idx].items[itemIdx].text = editingItemText;
                            setChecklists(updated);
                            setEditingItemIdx(null);
                            setEditingItemText('');
                          }}
                          onBlur={() => {
                            setEditingItemIdx(null);
                            setEditingItemText('');
                          }}
                        />
                      ) : (
                        <Pressable
                          className="flex-1"
                          onPress={() => {
                            setActiveIdx(idx);
                            setEditingItemIdx({ checklistIdx: idx, itemIdx });
                            setEditingItemText(item.text);
                          }}
                        >
                          <Text className={
                            'text-primaryFont text-sm' +
                            (item.checked ? ' line-through text-secondaryFont' : '')
                          }>
                            {item.text}
                          </Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => { setActiveIdx(idx); setMenuIdx(menuIdx === itemIdx && activeIdx === idx ? null : itemIdx); }} className="p-2">
                        <Image source={require('../assets/icons/3-dots.png')} style={{ width: 14, height: 14, tintColor: colors.secondaryFont }} />
                      </Pressable>
                      {menuIdx === itemIdx && activeIdx === idx && (
                        <>
                          {/* Overlay to close menu when clicking outside */}
                          <Pressable
                            className="absolute inset-0 z-10"
                            style={{ left: 0, top: 0, right: 0, bottom: 0 }}
                            onPress={() => setMenuIdx(null)}
                          >
                            {/* Transparent overlay */}
                          </Pressable>
                          <View className="absolute right-10 top-2 bg-modal border border-border rounded-xl shadow-lg z-20 flex-col">
                            <Pressable onPress={() => { setMenuIdx(null); deleteItem(itemIdx); }} className="px-6 py-2">
                              <Text className="text-red-400 text-base">Delete Item</Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      {/* divider */}
      <View className="h-[1px] bg-divider w-full mb-6" />
      {/* Modal for add/edit checklist or item */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setModalVisible(false); setModalType(null); setEditItemIdx(null); }}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-modal p-6 rounded-2xl w-11/12 max-w-md">
            <Text className="text-primaryFont text-2xl font-BellezaRegular mb-3">
              {modalType === 'addChecklist' && 'Add Checklist'}
              {modalType === 'addItem' && 'Add Item'}
              {modalType === 'editItem' && 'Edit Item'}
            </Text>
            <TextInput
              className="bg-modal text-primaryFont py-2 mb-4 text-base font-InterBold"
              placeholder={modalType === 'addChecklist' ? 'Checklist name...' : 'Item...'}
              placeholderTextColor="#828282"
              value={modalType === 'addChecklist' ? newChecklistName : modalType === 'editItem' ? editItemText : newItem}
              onChangeText={modalType === 'addChecklist' ? setNewChecklistName : modalType === 'editItem' ? setEditItemText : setNewItem}
              maxLength={modalType === 'addChecklist' ? 40 : 60}
              autoFocus
            />
            <View className="flex-row justify-end">
              <Pressable onPress={() => { setModalVisible(false); setModalType(null); setEditItemIdx(null); }} className="px-4 py-2 mr-2 rounded bg-gray-600 active:opacity-80">
                <Text className="text-white text-sm">Cancel</Text>
              </Pressable>
              {modalType === 'addChecklist' && (
                <Pressable onPress={handleAddChecklist} className="px-4 py-2 rounded bg-accentFont active:opacity-80">
                  <Text className="text-white text-sm">Add</Text>
                </Pressable>
              )}
              {modalType === 'addItem' && (
                <Pressable onPress={handleAddItem} className="px-4 py-2 rounded bg-accentFont active:opacity-80">
                  <Text className="text-white text-sm">Add</Text>
                </Pressable>
              )}
              {modalType === 'editItem' && (
                <Pressable onPress={handleEditItem} className="px-4 py-2 rounded bg-accentFont active:opacity-80">
                  <Text className="text-white text-sm">Save</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
