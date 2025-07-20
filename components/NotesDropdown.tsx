import { useState } from 'react';
import { Alert, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';
import { useNotes } from '../hooks/useNotes';
import { Note } from '../types/database';

interface NotesDropdownProps {
  tripId: string; // Pass tripId from parent component
}

export default function NotesDropdown({ tripId }: NotesDropdownProps) {
  // Use our custom hook for notes management
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    clearError
  } = useNotes(tripId);

  // state for the current note input
  const [note, setNote] = useState('');
  // state for managing editing mode
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // state for the text input when editing a note
  const [editText, setEditText] = useState('');
  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  // state for which note's menu is open
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);

  // function to add a new note
  const addNote = async () => {
    if (note.trim()) {
      try {
        await createNote({
          content: note.trim(),
          category: 'general'
        });
        setNote('');
        setModalVisible(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to add note. Please try again.');
      }
    }
  };

  // function to delete a note by ID
  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              setMenuNoteId(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          }
        }
      ]
    );
  };

  // function to open modal for add or edit
  const openModal = (noteToEdit: Note | null = null) => {
    if (noteToEdit) {
      setEditingNote(noteToEdit);
      setEditText(noteToEdit.content);
    } else {
      setEditingNote(null);
      setNote('');
    }
    setMenuNoteId(null);
    setModalVisible(true);
  };

  // function to handle add or edit note from modal
  const handleModalAction = async () => {
    if (editingNote) {
      // Edit mode
      if (editText.trim()) {
        try {
          await updateNote(editingNote.id, {
            content: editText.trim()
          });
          setEditingNote(null);
          setEditText('');
          setModalVisible(false);
        } catch (error) {
          Alert.alert('Error', 'Failed to update note. Please try again.');
        }
      }
    } else {
      // Add mode
      await addNote();
    }
  };

  // function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View className='w-full'>
      <View className="flex-row items-center mb-3">
        <Text className="text-primaryFont text-xl font-BellezaRegular">
          Notes ({notes.length})
        </Text>
        <Pressable
          onPress={() => openModal(null)}
          className="bg-secondaryFont/30 px-1 py-1 mx-4 rounded-full"
          disabled={loading}
        >
          <Image 
            source={require('../assets/icons/add.png')} 
            style={{ 
              width: 16, 
              height: 16, 
              tintColor: loading ? '#888' : '#f48080' 
            }} 
          />
        </Pressable>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { 
          setModalVisible(false); 
          setEditingNote(null);
          setEditText('');
          setNote('');
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-modal p-6 rounded-2xl w-11/12 max-w-md">
            <Text className="text-primaryFont text-2xl font-BellezaRegular mb-3">
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>
            <TextInput
              className="bg-modal text-primaryFont py-2 mb-4 text-base font-InterBold"
              placeholder={editingNote ? 'Edit your note...' : 'Type your note...'}
              placeholderTextColor="#828282"
              value={editingNote ? editText : note}
              onChangeText={editingNote ? setEditText : setNote}
              multiline
              maxLength={200}
              autoFocus
            />
            <View className="flex-row justify-end">
              <Pressable 
                onPress={() => { 
                  setModalVisible(false); 
                  setEditingNote(null);
                  setEditText('');
                  setNote('');
                }} 
                className="px-4 py-2 mr-2 rounded bg-gray-600 active:opacity-80"
              >
                <Text className="text-white text-sm">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleModalAction} 
                className="px-4 py-2 rounded bg-accentFont active:opacity-80"
                disabled={loading}
              >
                <Text className="text-white text-sm">
                  {loading ? 'Saving...' : (editingNote ? 'Save' : 'Add')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <View className="mb-3 w-full bg- rounded-2xl shadow-md">
        {/* Error message */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
            <Pressable onPress={clearError} className="mt-2">
              <Text className="text-red-600 font-medium text-sm">Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Loading state */}
        {loading ? (
          <Text className="text-secondaryFont text-center mt-4 mb-4">Loading notes...</Text>
        ) : (
          <>
            {/* notes list */}
            {notes.length === 0 ? (
              <Text className="text-secondaryFont text-center mt-4 mb-4">No notes yet. Add your first note!</Text>
            ) : (
              <View className="w-full flex-row flex-wrap justify-between">
                {notes.map((item) => (
                  <Pressable 
                    key={item.id} 
                    onPress={() => openModal(item)}
                    className="bg-secondaryBG/60 rounded-xl p-4 mb-3 relative active:opacity-80" 
                    style={{ width: '48%', minHeight: 120 }}
                  >
                    <Text className="text-primaryFont text-sm flex-1 mb-2" numberOfLines={4}>
                      {item.content}
                    </Text>
                    
                    {/* Date and category */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-xs text-secondaryFont">
                        {formatDate(item.created_at)}
                      </Text>
                      {item.category !== 'general' && (
                        <View className="bg-accentFont rounded px-2 py-1">
                          <Text className="text-xs text-white capitalize">{item.category}</Text>
                        </View>
                      )}
                    </View>

                    {/* Menu button */}
                    <View className="absolute top-2 right-2">
                      <Pressable 
                        onPress={(event) => {
                          event.stopPropagation(); // Prevent card press when clicking menu
                          setMenuNoteId(menuNoteId === item.id ? null : item.id);
                        }} 
                        className="p-1"
                      >
                        <Image 
                          source={require('../assets/icons/3-dots.png')} 
                          style={{ width: 14, height: 14, tintColor: colors.secondaryFont }} 
                        />
                      </Pressable>
                      
                      {/* Menu dropdown */}
                      {menuNoteId === item.id && (
                        <>
                          {/* Overlay to close menu when clicking outside */}
                          <Pressable
                            className="absolute inset-0 z-10"
                            style={{ left: -200, top: -50, right: -50, bottom: -50 }}
                            onPress={() => setMenuNoteId(null)}
                          >
                            {/* Transparent overlay */}
                          </Pressable>
                          <View className="absolute right-0 top-6 bg-modal border border-border rounded-xl shadow-lg z-20 flex-col min-w-[120px]">
                            <Pressable 
                              onPress={() => openModal(item)} 
                              className="px-4 py-3 border-b border-border"
                            >
                              <Text className="text-primaryFont text-sm font-UrbanistRegular">Edit Note</Text>
                            </Pressable>
                            <Pressable 
                              onPress={() => handleDeleteNote(item.id)} 
                              className="px-4 py-3"
                            >
                              <Text className="text-red-400 text-sm font-UrbanistRegular">Delete Note</Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
