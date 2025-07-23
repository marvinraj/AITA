import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  const [modalType, setModalType] = useState<'addChecklist' | 'addItem' | 'editItem' | 'manageChecklist' | 'editChecklist' | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [selectedChecklistName, setSelectedChecklistName] = useState('');
  const [editChecklistName, setEditChecklistName] = useState('');
  const [editChecklistOriginalName, setEditChecklistOriginalName] = useState('');
  const [menuChecklistName, setMenuChecklistName] = useState<string | null>(null);

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

  // Edit checklist name
  const handleEditChecklist = async () => {
    if (!editChecklistName.trim() || !editChecklistOriginalName) return;
    
    const newCategoryName = editChecklistName.toLowerCase().replace(/\s+/g, '_');
    
    try {
      // Update all items in this category to the new category name
      const itemsToUpdate = getItemsByCategory(editChecklistOriginalName);
      await Promise.all(itemsToUpdate.map(item => 
        updateItem(item.id, { category: newCategoryName })
      ));
      
      // Update tracked checklists
      setAvailableChecklists(prev => 
        prev.map(name => name === editChecklistOriginalName ? newCategoryName : name)
      );
      
      // Update active checklist if it was the one being edited
      if (activeChecklistName === editChecklistOriginalName) {
        setActiveChecklistName(newCategoryName);
      }
      
      setEditChecklistName('');
      setEditChecklistOriginalName('');
      setModalVisible(false);
      setModalType(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to update checklist name. Please try again.');
    }
  };

  // Add item to active checklist
  const handleAddItem = async () => {
    const targetCategory = modalType === 'manageChecklist' ? selectedChecklistName : activeChecklistName;
    if (!newItem.trim() || !targetCategory) return;
    
    try {
      await createItem({
        trip_id: tripId,
        item_name: newItem,
        category: targetCategory
      });
      setNewItem('');
      if (modalType !== 'manageChecklist') {
        setModalVisible(false);
        setModalType(null);
      }
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
      if (modalType !== 'manageChecklist') {
        setModalVisible(false);
        setModalType(null);
      }
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
    } catch (err) {
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  // Open modal for add/edit
  const openModal = (type: 'addChecklist' | 'addItem' | 'editItem' | 'manageChecklist' | 'editChecklist', itemId?: string, itemName?: string, checklistName?: string) => {
    setModalType(type);
    setModalVisible(true);
    if (type === 'editItem' && itemId && itemName) {
      setEditItemId(itemId);
      setEditItemText(itemName);
    } else if (type === 'manageChecklist' && checklistName) {
      setSelectedChecklistName(checklistName);
      setActiveChecklistName(checklistName);
    } else if (type === 'editChecklist' && checklistName) {
      setEditChecklistOriginalName(checklistName);
      setEditChecklistName(checklistName.charAt(0).toUpperCase() + checklistName.slice(1).replace(/_/g, ' '));
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
              <Pressable 
                key={checklistName} 
                onPress={() => openModal('manageChecklist', undefined, undefined, checklistName)}
                className="w-full bg-secondaryBG/60 rounded-2xl px-4 py-5 shadow-md active:opacity-80"
                disabled={loading}
              >
                {/* Checklist name and menu button */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className={`text-primaryFont text-lg font-InterBold ${!isActive ? 'opacity-70' : ''}`}>
                    {displayName}
                  </Text>
                  <View className="relative">
                    <Pressable 
                      onPress={(event) => {
                        event?.stopPropagation();
                        setMenuChecklistName(menuChecklistName === checklistName ? null : checklistName);
                      }} 
                      className="p-2"
                    >
                      <Image 
                        source={require('../assets/icons/3-dots.png')} 
                        style={{ width: 14, height: 14, tintColor: colors.secondaryFont }} 
                      />
                    </Pressable>
                    
                    {/* Menu dropdown */}
                    {menuChecklistName === checklistName && (
                      <>
                        {/* Overlay to close menu when clicking outside */}
                        <Pressable
                          className="absolute inset-0 z-10"
                          style={{ left: -200, top: -50, right: -50, bottom: -50 }}
                          onPress={() => setMenuChecklistName(null)}
                        >
                          {/* Transparent overlay */}
                        </Pressable>
                        <View className="absolute right-0 top-8 bg-modal border border-border rounded-xl shadow-lg z-20 flex-col min-w-[140px]">
                          <Pressable 
                            onPress={() => {
                              setMenuChecklistName(null);
                              openModal('editChecklist', undefined, undefined, checklistName);
                            }} 
                            className="px-4 py-3 border-b border-border"
                          >
                            <Text className="text-primaryFont text-sm font-UrbanistRegular">Edit Checklist Name</Text>
                          </Pressable>
                          <Pressable 
                            onPress={() => {
                              setMenuChecklistName(null);
                              deleteChecklist(checklistName);
                            }} 
                            className="px-4 py-3"
                          >
                            <Text className="text-red-400 text-sm font-UrbanistRegular">Delete Checklist</Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
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
                        className="w-full rounded-xl px-4 py-1 flex-row items-center"
                      >
                        <Pressable 
                          onPress={(event) => {
                            event.stopPropagation(); // Prevent card press when clicking checkbox
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

                        <Text className={
                          'flex-1 text-primaryFont text-sm' +
                          (item.is_completed ? ' line-through text-secondaryFont' : '')
                        }>
                          {item.item_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* divider */}
      <View className="h-[1px]  w-full mb-12" />

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
          setSelectedChecklistName('');
          setEditChecklistName('');
          setEditChecklistOriginalName('');
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-modal p-6 rounded-2xl w-11/12 max-w-md">
            {modalType === 'manageChecklist' ? (
              <>
                <Text className="text-primaryFont text-2xl font-BellezaRegular mb-3">
                  {selectedChecklistName.charAt(0).toUpperCase() + selectedChecklistName.slice(1).replace(/_/g, ' ')}
                </Text>
                
                {/* Add new item input */}
                <View className="flex-row items-center mb-4">
                  <TextInput
                    className="flex-1 text-primaryFont py-2 px-3 rounded-lg text-sm font-InterRegular mr-2"
                    placeholder="Add an item..."
                    placeholderTextColor="#828282"
                    value={newItem}
                    onChangeText={setNewItem}
                    maxLength={100}
                    onSubmitEditing={handleAddItem}
                    returnKeyType="done"
                  />
                  <Pressable 
                    onPress={handleAddItem}
                    className="bg-accentFont px-3 py-2 rounded-lg"
                    disabled={loading || !newItem.trim()}
                  >
                    <Text className="text-white text-sm">Add</Text>
                  </Pressable>
                </View>

                {/* List of items in this checklist */}
                <ScrollView className="max-h-64 mb-4" showsVerticalScrollIndicator={false}>
                  {getItemsByCategory(selectedChecklistName).length === 0 ? (
                    <Text className="text-secondaryFont text-center py-4">No items yet</Text>
                  ) : (
                    <View className="flex flex-col gap-y-2">
                      {getItemsByCategory(selectedChecklistName).map((item) => (
                        <View key={item.id} className="flex-row items-center rounded-lg px-3 py-1">
                          <Pressable 
                            onPress={() => handleToggleItem(item.id, item.is_completed)} 
                            className="mr-3"
                            disabled={loading}
                          >
                            <Text className={item.is_completed ? 'text-green-400 text-lg' : 'text-gray-400 text-lg'}>
                              {item.is_completed ? '☑️' : '⬜'}
                            </Text>
                          </Pressable>

                          {editItemId === item.id ? (
                            <TextInput
                              className="flex-1 text-primaryFont text-sm bg-transparent"
                              value={editItemText}
                              onChangeText={setEditItemText}
                              onSubmitEditing={handleEditItem}
                              onBlur={() => {
                                setEditItemId(null);
                                setEditItemText('');
                              }}
                              autoFocus
                              maxLength={100}
                            />
                          ) : (
                            <Pressable 
                              onPress={() => {
                                setEditItemId(item.id);
                                setEditItemText(item.item_name);
                              }}
                              className="flex-1"
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
                            onPress={() => handleDeleteItem(item.id)}
                            className="ml-2 p-1"
                            disabled={loading}
                          >
                            <Text className="text-red-400 text-xs">✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* Close button */}
                <View className="flex-row justify-end">
                  <Pressable 
                    onPress={() => {
                      setModalVisible(false);
                      setModalType(null);
                      setSelectedChecklistName('');
                      setNewItem('');
                      setEditItemId(null);
                      setEditItemText('');
                    }}
                    className="px-4 py-2 rounded bg-gray-600 active:opacity-80 mt-4"
                  >
                    <Text className="text-white text-sm">Done</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text className="text-primaryFont text-2xl font-BellezaRegular mb-3">
                  {modalType === 'addChecklist' && 'Add Checklist'}
                  {modalType === 'editChecklist' && 'Edit Checklist'}
                  {modalType === 'addItem' && 'Add Item'}
                  {modalType === 'editItem' && 'Edit Item'}
                </Text>
                <TextInput
                  className="bg-modal text-primaryFont py-2 mb-4 text-base font-InterBold"
                  placeholder={(modalType === 'addChecklist' || modalType === 'editChecklist') ? 'Checklist name...' : 'Item...'}
                  placeholderTextColor="#828282"
                  value={
                    modalType === 'addChecklist' ? newChecklistName : 
                    modalType === 'editChecklist' ? editChecklistName :
                    modalType === 'editItem' ? editItemText : 
                    newItem
                  }
                  onChangeText={
                    modalType === 'addChecklist' ? setNewChecklistName : 
                    modalType === 'editChecklist' ? setEditChecklistName :
                    modalType === 'editItem' ? setEditItemText : 
                    setNewItem
                  }
                  maxLength={(modalType === 'addChecklist' || modalType === 'editChecklist') ? 40 : 100}
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
                      setSelectedChecklistName('');
                      setEditChecklistName('');
                      setEditChecklistOriginalName('');
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
                  {modalType === 'editChecklist' && (
                    <Pressable 
                      onPress={handleEditChecklist} 
                      className="px-4 py-2 rounded bg-accentFont active:opacity-80"
                      disabled={loading}
                    >
                      <Text className="text-white text-sm">Save</Text>
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
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
