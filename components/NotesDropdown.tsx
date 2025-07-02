import { useState } from 'react';
import { Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';

export default function NotesCard() {
  // state for the current note input
  const [note, setNote] = useState('');
  // state for the list of notes
  const [notes, setNotes] = useState<string[]>([]);
  // state for managing editing mode
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  // state for the text input when editing a note
  const [editText, setEditText] = useState('');
  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  // state for which note's menu is open
  const [menuIdx, setMenuIdx] = useState<number | null>(null);

  // function to add a new note
  const addNote = () => {
    if (note.trim()) {
      setNotes([note, ...notes]);
      setNote('');
      setModalVisible(false);
    }
  };

  // function to delete a note by index
  const deleteNote = (idx: number) => {
    setNotes(notes.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditText('');
    }
  };

  // function to open modal for add or edit
  const openModal = (editIdx: number | null = null) => {
    if (editIdx !== null) {
      setEditingIdx(editIdx);
      setEditText(notes[editIdx]);
    } else {
      setEditingIdx(null);
      setNote('');
    }
    setModalVisible(true);
  };

  // function to handle add or edit note from modal
  const handleModalAction = () => {
    if (editingIdx !== null) {
      // Edit mode
      if (editText.trim()) {
        setNotes(notes.map((n, i) => (i === editingIdx ? editText : n)));
        setEditingIdx(null);
        setEditText('');
        setModalVisible(false);
      }
    } else {
      // Add mode
      if (note.trim()) {
        setNotes([note, ...notes]);
        setNote('');
        setModalVisible(false);
      }
    }
  };

  return (
    <View className='w-full'>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-primaryFont text-xl font-UrbanistSemiBold">Notes</Text>
        <Pressable
          onPress={() => openModal(null)}
          className="bg-transparent px-3 py-2"
        >
          <Image source={require('../assets/icons/add.png')} style={{ width: 18, height: 18, tintColor: 'white' }} />
        </Pressable>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setModalVisible(false); setEditingIdx(null); }}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-modal p-6 rounded-2xl w-11/12 max-w-md">
            <Text className="text-primaryFont text-2xl font-BellezaRegular mb-3">
              {editingIdx !== null ? 'Edit Note' : 'Add Note'}
            </Text>
            <TextInput
              className="bg-modal text-primaryFont py-2 mb-4 text-base font-InterBold"
              placeholder={editingIdx !== null ? 'Edit your note...' : 'Type your note...'}
              placeholderTextColor="#828282"
              value={editingIdx !== null ? editText : note}
              onChangeText={editingIdx !== null ? setEditText : setNote}
              multiline
              maxLength={200}
              autoFocus
            />
            <View className="flex-row justify-end">
              <Pressable onPress={() => { setModalVisible(false); setEditingIdx(null); }} className="px-4 py-2 mr-2 rounded bg-gray-600 active:opacity-80">
                <Text className="text-white text-sm">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleModalAction} className="px-4 py-2 rounded bg-accentFont active:opacity-80">
                <Text className="text-white text-sm">{editingIdx !== null ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <View className="mb-3 w-full bg- rounded-2xl shadow-md">
        {/* notes list */}
        {notes.length === 0 ? (
          <Text className="text-secondaryFont text-center mt-4 mb-4">No notes yet. Add your first note!</Text>
        ) : (
          <View className="w-full flex-row flex-wrap justify-between">
            {notes.map((item, index) => (
              <View key={index} className="bg-buttonPrimaryBG rounded-xl p-4 mb-3 relative" style={{ width: '48%', minHeight: 120 }}>
                <Text className="text-primaryFont text-sm flex-1 mb-2" numberOfLines={4}>{item}</Text>
                <View className="absolute top-2 right-2">
                  <Pressable onPress={() => setMenuIdx(menuIdx === index ? null : index)} className="p-1">
                    <Image source={require('../assets/icons/3-dots.png')} style={{ width: 14, height: 14, tintColor: colors.secondaryFont }} />
                  </Pressable>
                  {menuIdx === index && (
                    <>
                      {/* Overlay to close menu when clicking outside */}
                      <Pressable
                        className="absolute inset-0 z-10"
                        style={{ left: -200, top: -50, right: -50, bottom: -50 }}
                        onPress={() => setMenuIdx(null)}
                      >
                        {/* Transparent overlay */}
                      </Pressable>
                      <View className="absolute right-0 top-6 bg-modal border border-border rounded-xl shadow-lg z-20 flex-col min-w-[120px]">
                        <Pressable onPress={() => { setMenuIdx(null); openModal(index); }} className="px-4 py-3 border-b border-border">
                          <Text className="text-primaryFont text-sm font-UrbanistRegular">Edit Note</Text>
                        </Pressable>
                        <Pressable onPress={() => { setMenuIdx(null); deleteNote(index); }} className="px-4 py-3">
                          <Text className="text-red-400 text-sm font-UrbanistRegular">Delete Note</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* divider */}
      <View className="h-[1px] bg-divider w-full mb-6" />
    </View>
  );
}
