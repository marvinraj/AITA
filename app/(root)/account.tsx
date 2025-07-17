import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const AccountScreen = () => {
    const router = useRouter();
    
    // State for account data
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [account, setAccount] = useState({
        email: '',
        birthday: '',
        country: '',
        phoneNumber: '',
        timeZone: '',
        twoFactorEnabled: false,
        marketingEmails: true,
        accountPrivate: false
    });

    useEffect(() => {
        getAccountInfo();
    }, []);

    const getAccountInfo = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error('No user found');

            // Get user email from auth
            setAccount(prev => ({ ...prev, email: user.email || '' }));

            // Get additional account info from profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setAccount(prev => ({
                    ...prev,
                    birthday: data.birthday || '',
                    country: data.country || '',
                    phoneNumber: data.phone_number || '',
                    timeZone: data.time_zone || '',
                    twoFactorEnabled: data.two_factor_enabled || false,
                    marketingEmails: data.marketing_emails !== false,
                    accountPrivate: data.account_private || false
                }));
            }
        } catch (error) {
            console.error('Error loading account info:', error);
            Alert.alert('Error', 'Failed to load account information');
        } finally {
            setLoading(false);
        }
    };

    const updateAccount = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error('No user found');

            // Update email if changed
            if (account.email !== user.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: account.email
                });
                if (emailError) throw emailError;
                
                Alert.alert(
                    'Email Update',
                    'A confirmation email has been sent to your new email address. Please check your inbox.'
                );
            }

            // Update other account info
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    birthday: account.birthday,
                    country: account.country,
                    phone_number: account.phoneNumber,
                    time_zone: account.timeZone,
                    two_factor_enabled: account.twoFactorEnabled,
                    marketing_emails: account.marketingEmails,
                    account_private: account.accountPrivate,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            Alert.alert('Success', 'Account updated successfully!');
        } catch (error) {
            console.error('Error updating account:', error);
            Alert.alert('Error', 'Failed to update account');
        } finally {
            setSaving(false);
        }
    };

    const deleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: confirmDeleteAccount
                }
            ]
        );
    };

    const confirmDeleteAccount = () => {
        Alert.alert(
            'Final Confirmation',
            'This will permanently delete your account and all your data. Type "DELETE" to confirm.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'I understand, delete my account', style: 'destructive' }
            ]
        );
    };

    const renderInputField = (
        label: string, 
        value: string, 
        onChangeText: (text: string) => void,
        placeholder: string,
        keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
        editable: boolean = true
    ) => (
        <View className="mb-6">
            <Text className="text-primaryFont text-sm font-InterRegular mb-2">
                {label}
            </Text>
            <TextInput
                className={`border border-border rounded-lg px-4 py-3 text-primaryFont font-InterRegular h-12 ${
                    !editable ? 'bg-gray-100' : ''
                }`}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType}
                editable={editable}
            />
        </View>
    );

    const renderSwitchField = (
        label: string,
        description: string,
        value: boolean,
        onValueChange: (value: boolean) => void
    ) => (
        <View className="flex-row items-center justify-between py-4 border-b border-border">
            <View className="flex-1 mr-4">
                <Text className="text-primaryFont text-base font-InterRegular mb-1">
                    {label}
                </Text>
                <Text className="text-secondaryFont text-xs font-InterRegular">
                    {description}
                </Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={value ? '#ffffff' : '#f4f3f4'}
            />
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 bg-primaryBG items-center justify-center">
                <Text className="text-primaryFont font-InterRegular">Loading account...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-primaryBG">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-12 pb-6 border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Entypo name="chevron-left" size={24} color="#828282" />
                    <Text className="text-secondaryFont font-InterRegular ml-1">Back</Text>
                </TouchableOpacity>
                <Text className="text-primaryFont text-lg font-BellezaRegular">
                    Account
                </Text>
                <TouchableOpacity 
                    onPress={updateAccount}
                    disabled={saving}
                    className={`px-4 py-2 rounded-full ${saving ? 'bg-gray-300' : 'bg-blue-500'}`}
                >
                    <Text className="text-white font-InterRegular">
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Basic Information */}
                <View className="mb-8">
                    <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider mb-4">
                        Basic Information
                    </Text>

                    {renderInputField(
                        'Email Address',
                        account.email,
                        (text) => setAccount(prev => ({ ...prev, email: text })),
                        'Enter your email',
                        'email-address'
                    )}

                    {renderInputField(
                        'Phone Number',
                        account.phoneNumber,
                        (text) => setAccount(prev => ({ ...prev, phoneNumber: text })),
                        '+1 (555) 123-4567',
                        'phone-pad'
                    )}

                    {renderInputField(
                        'Birthday',
                        account.birthday,
                        (text) => setAccount(prev => ({ ...prev, birthday: text })),
                        'YYYY-MM-DD'
                    )}

                    {renderInputField(
                        'Country',
                        account.country,
                        (text) => setAccount(prev => ({ ...prev, country: text })),
                        'United States'
                    )}

                    {renderInputField(
                        'Time Zone',
                        account.timeZone,
                        (text) => setAccount(prev => ({ ...prev, timeZone: text })),
                        'America/New_York'
                    )}
                </View>

                {/* Privacy & Security */}
                <View className="mb-8">
                    <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider mb-4">
                        Privacy & Security
                    </Text>

                    {renderSwitchField(
                        'Two-Factor Authentication',
                        'Add an extra layer of security to your account',
                        account.twoFactorEnabled,
                        (value) => setAccount(prev => ({ ...prev, twoFactorEnabled: value }))
                    )}

                    {renderSwitchField(
                        'Private Account',
                        'Make your profile and trips private',
                        account.accountPrivate,
                        (value) => setAccount(prev => ({ ...prev, accountPrivate: value }))
                    )}

                    {renderSwitchField(
                        'Marketing Emails',
                        'Receive emails about new features and travel deals',
                        account.marketingEmails,
                        (value) => setAccount(prev => ({ ...prev, marketingEmails: value }))
                    )}
                </View>

                {/* Danger Zone */}
                <View className="mb-8">
                    <Text className="text-red-600 text-sm font-InterRegular uppercase tracking-wider mb-4">
                        Danger Zone
                    </Text>
                    
                    <TouchableOpacity 
                        onPress={deleteAccount}
                        className="border border-red-500 rounded-lg px-4 py-3 items-center"
                    >
                        <Text className="text-red-600 font-InterRegular">
                            Delete Account
                        </Text>
                    </TouchableOpacity>
                    
                    <Text className="text-secondaryFont text-xs font-InterRegular mt-2 text-center">
                        This action cannot be undone. All your data will be permanently deleted.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default AccountScreen;
