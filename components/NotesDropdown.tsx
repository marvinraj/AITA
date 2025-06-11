import { useState } from 'react';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NotesDropdown() {
  // state management for notes
  const [open, setOpen] = useState(false);
  // state for the current note input
  const [note, setNote] = useState('');
  // state for the list of notes
  const [notes, setNotes] = useState<string[]>([]);
  // state for managing editing mode
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  // state for the text input when editing a note
  const [editText, setEditText] = useState('');

  // function to add a new note
  const addNote = () => {
    if (note.trim()) {
      setNotes([note, ...notes]);
      setNote('');
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

  // function to start editing a note
  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(notes[idx]);
  };

  // function to save the edited note
  const saveEdit = (idx: number) => {
    if (editText.trim()) {
      setNotes(notes.map((n, i) => (i === idx ? editText : n)));
      setEditingIdx(null);
      setEditText('');
    }
  };

  return (
    <View className="mb-3 w-full">
      {/* dropdown */}
      <TouchableOpacity onPress={() => setOpen(!open)} className="flex-row justify-between items-center px-4 py-3 rounded-2xl border border-[#35345a]">
        <Text className="text-primaryFont text-base font-InterBold">Notes</Text>
        <Text className="text-primaryFont text-xl">{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View className="px-2 py-3 rounded-b-2xl">
          {/* input area */}
          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 bg-[#23223a] text-primaryFont px-4 py-2 rounded-xl border border-[#35345a] mr-2 text-sm"
              placeholder="Add a note..."
              placeholderTextColor="#828282"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
            />
            <Pressable
              onPress={addNote}
              className="bg-accentFont rounded-xl px-4 py-2 active:opacity-80"
            >
              <Text className="text-white font-bold text-base">+</Text>
            </Pressable>
          </View>
          {/* notes list */}
          {notes.length === 0 ? (
            <Text className="text-secondaryFont text-center mt-2">No notes yet. Add your first note!</Text>
          ) : (
            <View>
              {notes.map((item, index) => (
                <View key={index} className="bg-[#35345a] rounded-xl px-4 py-2 mb-2 flex-row items-center">
                  {editingIdx === index ? (
                    <>
                      <TextInput
                        className="flex-1 bg-transparent text-primaryFont text-sm mr-2"
                        value={editText}
                        onChangeText={setEditText}
                        autoFocus
                        multiline
                        maxLength={200}
                      />
                      <Pressable onPress={() => saveEdit(index)} className="px-2 py-1 mr-1 rounded bg-green-600 active:opacity-80">
                        <Text className="text-white text-xs">Save</Text>
                      </Pressable>
                      <Pressable onPress={() => { setEditingIdx(null); setEditText(''); }} className="px-2 py-1 rounded bg-gray-600 active:opacity-80">
                        <Text className="text-white text-xs">Cancel</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text className="text-primaryFont text-sm flex-1">{item}</Text>
                      <Pressable onPress={() => startEdit(index)} className="px-2 py-1 mr-1 rounded bg-blue-600 active:opacity-80">
                        <Text className="text-white text-xs">Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => deleteNote(index)} className="px-2 py-1 rounded bg-red-600 active:opacity-80">
                        <Text className="text-white text-xs">Delete</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
