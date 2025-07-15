import { useState } from 'react';
import { Alert, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';
import { useChecklist } from '../hooks/useChecklist';

interface TravelChecklistDropdownProps {
  tripId: string;
}

export default function TravelChecklistDropdown({ tripId }: TravelChecklistDropdownProps) {
  const {
    items,
    loading,
    error,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
    stats,
    getItemsByCategory
  } = useChecklist({
    tripId,
    autoLoad: true,
    enableStats: true,
    enableCategories: true
  });

  // Track checklists separately from items to support empty checklists
  const [availableChecklists, setAvailableChecklists] = useState<string[]>([]);
  
  // Merge tracked checklists with categories from existing items
  const categoriesFromItems = [...new Set(items.map(item => item.category))].filter(Boolean);
  const allChecklists = [...new Set([...availableChecklists, ...categoriesFromItems])];
  
  const [activeChecklistName, setActiveChecklistName] = useState<string>('');
  const [newChecklistName, setNewChecklistName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'addChecklist' | 'addItem' | 'editItem' | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Set the first available checklist as active when items load
  if (allChecklists.length > 0 && !activeChecklistName) {
    setActiveChecklistName(allChecklists[0]);
  }

  // Add checklist (create new category)
  const handleAddChecklist = async () => {
    if (!newChecklistName.trim()) return;
    
    const newCategoryName = newChecklistName.toLowerCase().replace(/\s+/g, '_');
    setAvailableChecklists(prev => [...prev, newCategoryName]);
    setActiveChecklistName(newCategoryName);
    setNewChecklistName('');
    setModalVisible(false);
    setModalType(null);
  };

  // Delete checklist (delete all items in category)
  const deleteChecklist = async (checklistName: string) => {
    try {
      const itemsToDelete = getItemsByCategory(checklistName);
      await Promise.all(itemsToDelete.map(item => deleteItem(item.id)));
      
      // Remove from tracked checklists
      setAvailableChecklists(prev => prev.filter(name => name !== checklistName));
      
      // Set active to first remaining checklist
      const remainingChecklists = allChecklists.filter(name => name !== checklistName);
      if (remainingChecklists.length > 0) {
        setActiveChecklistName(remainingChecklists[0]);
      } else {
        setActiveChecklistName('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete checklist. Please try again.');
    }
  };

  // Add item to active checklist
  const handleAddItem = async () => {
    if (!newItem.trim() || !activeChecklistName) return;
    
    try {
      await createItem({
        trip_id: tripId,
        item_name: newItem,
        category: activeChecklistName
      });
      setNewItem('');
      setModalVisible(false);
      setModalType(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  // Edit item
  const handleEditItem = async () => {
    if (!editItemId || !editItemText.trim()) return;
    
    try {
      await updateItem(editItemId, { item_name: editItemText });
      setEditItemId(null);
      setEditItemText('');
      setModalVisible(false);
      setModalType(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  // Toggle item checked
  const handleToggleItem = async (itemId: string, currentStatus: boolean) => {
    try {
      await toggleItem(itemId, !currentStatus);
    } catch (err) {
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      setMenuItemId(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  // Save inline edit
  const handleInlineEdit = async (itemId: string, newText: string) => {
    if (!newText.trim()) {
      setEditingItemId(null);
      setEditingItemText('');
      return;
    }
    
    try {
      await updateItem(itemId, { item_name: newText });
      setEditingItemId(null);
      setEditingItemText('');
    } catch (err) {
      Alert.alert('Error', 'Failed to update item. Please try again.');
      setEditingItemId(null);
      setEditingItemText('');
    }
  };

  // Open modal for add/edit
  const openModal = (type: 'addChecklist' | 'addItem' | 'editItem', itemId?: string, itemName?: string) => {
    setModalType(type);
    setModalVisible(true);
    if (type === 'editItem' && itemId && itemName) {
      setEditItemId(itemId);
      setEditItemText(itemName);
    } else if (type === 'addItem') {
      setNewItem('');
    } else if (type === 'addChecklist') {
      setNewChecklistName('');
    }
  };

  if (error) {
    return (
      <View className="w-full">
        <Text className="text-red-400 text-center">Error loading checklist: {error}</Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Checklist title and add checklist button */}
      <View className="flex-row items-center mb-3">
        <Text className="text-primaryFont text-xl font-BellezaRegular">Travel Checklist</Text>
        <Pressable
          onPress={() => openModal('addChecklist')}
          className="bg-secondaryFont/30 px-1 py-1 mx-4 rounded-full"
          disabled={loading}
        >
          <Image source={require('../assets/icons/add.png')} style={{ width: 16, height: 16, tintColor: '#f48080' }} />
        </Pressable>
      </View>

      {/* Each checklist as a card */}
      {allChecklists.length === 0 ? (
        <Text className="text-secondaryFont text-center mt-4 mb-4">No checklists yet. Add your first checklist!</Text>
      ) : (
        <View className="flex flex-col gap-y-4 w-full">
          {allChecklists.map((checklistName) => {
            const checklistItems = getItemsByCategory(checklistName);
            const isActive = activeChecklistName === checklistName;
            const displayName = checklistName.charAt(0).toUpperCase() + checklistName.slice(1).replace(/_/g, ' ');
            
            return (
              <View key={checklistName} className="w-full bg-secondaryBG/60 rounded-2xl px-4 py-5 shadow-md">
                {/* Checklist name and delete button */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className={`text-primaryFont text-base font-InterBold ${!isActive ? 'opacity-70' : ''}`}>
                    {displayName}
                  </Text>
                  <Pressable 
                    onPress={() => deleteChecklist(checklistName)} 
                    className="px-2 py-1 rounded-full bg-red-900 active:opacity-80 ml-1"
                  >
                    <Text className="text-white text-xs">✕</Text>
                  </Pressable>
                </View>

                {/* Add item input for this checklist */}
                <View className="w-full rounded-xl px-2 py-2 flex-row items-center mb-3">
                  <TextInput
                    className="flex-1 bg-transparent text-primaryFont text-sm font-InterRegular"
                    placeholder="Add an item..."
                    placeholderTextColor="#828282"
                    value={isActive ? newItem : ''}
                    onChangeText={(val) => {
                      if (isActive) setNewItem(val);
                    }}
                    onFocus={() => setActiveChecklistName(checklistName)}
                    maxLength={100}
                    onSubmitEditing={() => {
                      if (isActive) handleAddItem();
                    }}
                    returnKeyType="done"
                    editable={!loading}
                  />
                </View>

                {/* Checklist items */}
                {loading ? (
                  <Text className="text-secondaryFont font-InterRegular text-center mt-2">Loading...</Text>
                ) : checklistItems.length === 0 ? (
                  <Text className="text-secondaryFont font-InterRegular text-center mt-2">No items yet. Add your first item!</Text>
                ) : (
                  <View className="flex flex-col gap-y-2 w-full">
                    {checklistItems.map((item) => (
                      <View
                        key={item.id}
                        className="w-full rounded-xl px-4 flex-row items-center relative"
                      >
                        <Pressable 
                          onPress={() => {
                            setActiveChecklistName(checklistName);
                            handleToggleItem(item.id, item.is_completed);
                          }} 
                          className="mr-3" 
                          hitSlop={10}
                          disabled={loading}
                        >
                          <Text className={item.is_completed ? 'text-green-400 text-lg' : 'text-gray-400 text-lg'}>
                            {item.is_completed ? '☑️' : '⬜'}
                          </Text>
                        </Pressable>

                        {editingItemId === item.id ? (
                          <TextInput
                            className="flex-1 bg-transparent font-InterRegular text-primaryFont text-sm mr-2"
                            value={editingItemText}
                            onChangeText={setEditingItemText}
                            autoFocus
                            maxLength={100}
                            onSubmitEditing={() => handleInlineEdit(item.id, editingItemText)}
                            onBlur={() => handleInlineEdit(item.id, editingItemText)}
                          />
                        ) : (
                          <Pressable
                            className="flex-1"
                            onPress={() => {
                              setActiveChecklistName(checklistName);
                              setEditingItemId(item.id);
                              setEditingItemText(item.item_name);
                            }}
                            disabled={loading}
                          >
                            <Text className={
                              'text-primaryFont text-sm' +
                              (item.is_completed ? ' line-through text-secondaryFont' : '')
                            }>
                              {item.item_name}
                            </Text>
                          </Pressable>
                        )}

                        <Pressable 
                          onPress={() => {
                            setActiveChecklistName(checklistName);
                            setMenuItemId(menuItemId === item.id ? null : item.id);
                          }} 
                          className="p-2"
                          disabled={loading}
                        >
                          <Image 
                            source={require('../assets/icons/3-dots.png')} 
                            style={{ width: 14, height: 14, tintColor: colors.secondaryFont }} 
                          />
                        </Pressable>

                        {menuItemId === item.id && (
                          <>
                            {/* Overlay to close menu when clicking outside */}
                            <Pressable
                              className="absolute inset-0 z-10"
                              style={{ left: 0, top: 0, right: 0, bottom: 0 }}
                              onPress={() => setMenuItemId(null)}
                            />
                            <View className="absolute right-10 top-2 bg-modal border border-border rounded-xl shadow-lg z-20 flex-col">
                              <Pressable 
                                onPress={() => {
                                  setMenuItemId(null);
                                  openModal('editItem', item.id, item.item_name);
                                }} 
                                className="px-6 py-2"
                              >
                                <Text className="text-primaryFont text-sm font-UrbanistRegular">Edit Item</Text>
                              </Pressable>
                              <Pressable 
                                onPress={() => handleDeleteItem(item.id)} 
                                className="px-6 py-2"
                              >
                                <Text className="text-red-400 text-sm font-UrbanistRegular">Delete Item</Text>
                              </Pressable>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* divider */}
      <View className="h-[1px] bg-divider w-full mb-6" />

      {/* Modal for add/edit checklist or item */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { 
          setModalVisible(false); 
          setModalType(null); 
          setEditItemId(null); 
          setEditItemText('');
          setNewChecklistName('');
        }}
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
              value={
                modalType === 'addChecklist' ? newChecklistName : 
                modalType === 'editItem' ? editItemText : 
                newItem
              }
              onChangeText={
                modalType === 'addChecklist' ? setNewChecklistName : 
                modalType === 'editItem' ? setEditItemText : 
                setNewItem
              }
              maxLength={modalType === 'addChecklist' ? 40 : 100}
              autoFocus
            />
            <View className="flex-row justify-end">
              <Pressable 
                onPress={() => { 
                  setModalVisible(false); 
                  setModalType(null); 
                  setEditItemId(null);
                  setEditItemText('');
                  setNewChecklistName('');
                }} 
                className="px-4 py-2 mr-2 rounded bg-gray-600 active:opacity-80"
              >
                <Text className="text-white text-sm">Cancel</Text>
              </Pressable>
              {modalType === 'addChecklist' && (
                <Pressable 
                  onPress={handleAddChecklist} 
                  className="px-4 py-2 rounded bg-accentFont active:opacity-80"
                  disabled={loading}
                >
                  <Text className="text-white text-sm">Add</Text>
                </Pressable>
              )}
              {modalType === 'addItem' && (
                <Pressable 
                  onPress={handleAddItem} 
                  className="px-4 py-2 rounded bg-accentFont active:opacity-80"
                  disabled={loading}
                >
                  <Text className="text-white text-sm">Add</Text>
                </Pressable>
              )}
              {modalType === 'editItem' && (
                <Pressable 
                  onPress={handleEditItem} 
                  className="px-4 py-2 rounded bg-accentFont active:opacity-80"
                  disabled={loading}
                >
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
