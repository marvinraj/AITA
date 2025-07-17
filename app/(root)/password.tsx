import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const PasswordScreen = () => {
    const router = useRouter();
    
    // State for password form
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return {
            minLength,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial,
            isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
        };
    };

    const updatePassword = async () => {
        try {
            // Validation
            if (!formData.currentPassword) {
                Alert.alert('Error', 'Please enter your current password');
                return;
            }

            if (!formData.newPassword) {
                Alert.alert('Error', 'Please enter a new password');
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                Alert.alert('Error', 'New passwords do not match');
                return;
            }

            const passwordValidation = validatePassword(formData.newPassword);
            if (!passwordValidation.isValid) {
                Alert.alert('Error', 'New password does not meet security requirements');
                return;
            }

            if (formData.currentPassword === formData.newPassword) {
                Alert.alert('Error', 'New password must be different from current password');
                return;
            }

            setLoading(true);

            // Update password using Supabase
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (error) {
                throw error;
            }

            Alert.alert(
                'Success', 
                'Your password has been updated successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
            );

            // Clear form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (error: any) {
            console.error('Error updating password:', error);
            Alert.alert(
                'Error', 
                error.message || 'Failed to update password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const sendResetEmail = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user?.email) {
                Alert.alert('Error', 'No email associated with this account');
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(user.email);

            if (error) throw error;

            Alert.alert(
                'Reset Email Sent',
                'A password reset link has been sent to your email address.'
            );
        } catch (error: any) {
            console.error('Error sending reset email:', error);
            Alert.alert('Error', 'Failed to send reset email');
        }
    };

    const renderPasswordInput = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder: string,
        showPassword: boolean,
        toggleShow: () => void,
        field: 'current' | 'new' | 'confirm'
    ) => (
        <View className="mb-6">
            <Text className="text-primaryFont text-sm font-InterRegular mb-2">
                {label}
            </Text>
            <View className="relative">
                <TextInput
                    className="border border-border rounded-lg px-4 py-3 pr-12 text-primaryFont font-InterRegular h-12"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={toggleShow}
                    className="absolute right-3 top-3"
                >
                    <MaterialIcons 
                        name={showPassword ? 'visibility-off' : 'visibility'} 
                        size={20} 
                        color="#9CA3AF" 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPasswordRequirements = () => {
        const validation = validatePassword(formData.newPassword);
        
        const requirements = [
            { key: 'minLength', text: 'At least 8 characters', met: validation.minLength },
            { key: 'hasUpper', text: 'One uppercase letter', met: validation.hasUpper },
            { key: 'hasLower', text: 'One lowercase letter', met: validation.hasLower },
            { key: 'hasNumber', text: 'One number', met: validation.hasNumber },
            { key: 'hasSpecial', text: 'One special character', met: validation.hasSpecial },
        ];

        return (
            <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-primaryFont text-sm font-InterRegular mb-3">
                    Password Requirements:
                </Text>
                {requirements.map((req) => (
                    <View key={req.key} className="flex-row items-center mb-1">
                        <MaterialIcons 
                            name={req.met ? 'check-circle' : 'radio-button-unchecked'} 
                            size={16} 
                            color={req.met ? '#10B981' : '#9CA3AF'} 
                        />
                        <Text className={`ml-2 text-xs font-InterRegular ${
                            req.met ? 'text-green-600' : 'text-secondaryFont'
                        }`}>
                            {req.text}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-primaryBG">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-12 pb-6 border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Entypo name="chevron-left" size={24} color="#828282" />
                    <Text className="text-secondaryFont font-InterRegular ml-1">Back</Text>
                </TouchableOpacity>
                <Text className="text-primaryFont text-lg font-BellezaRegular">
                    Change Password
                </Text>
                <View className="w-16" />
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Current Password */}
                {renderPasswordInput(
                    'Current Password',
                    formData.currentPassword,
                    (text) => setFormData(prev => ({ ...prev, currentPassword: text })),
                    'Enter your current password',
                    showPasswords.current,
                    () => setShowPasswords(prev => ({ ...prev, current: !prev.current })),
                    'current'
                )}

                {/* New Password */}
                {renderPasswordInput(
                    'New Password',
                    formData.newPassword,
                    (text) => setFormData(prev => ({ ...prev, newPassword: text })),
                    'Enter your new password',
                    showPasswords.new,
                    () => setShowPasswords(prev => ({ ...prev, new: !prev.new })),
                    'new'
                )}

                {/* Password Requirements */}
                {formData.newPassword.length > 0 && renderPasswordRequirements()}

                {/* Confirm Password */}
                {renderPasswordInput(
                    'Confirm New Password',
                    formData.confirmPassword,
                    (text) => setFormData(prev => ({ ...prev, confirmPassword: text })),
                    'Re-enter your new password',
                    showPasswords.confirm,
                    () => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm })),
                    'confirm'
                )}

                {/* Password Match Indicator */}
                {formData.confirmPassword.length > 0 && (
                    <View className="flex-row items-center mb-6">
                        <MaterialIcons 
                            name={formData.newPassword === formData.confirmPassword ? 'check-circle' : 'error'} 
                            size={16} 
                            color={formData.newPassword === formData.confirmPassword ? '#10B981' : '#EF4444'} 
                        />
                        <Text className={`ml-2 text-xs font-InterRegular ${
                            formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                        </Text>
                    </View>
                )}

                {/* Update Button */}
                <TouchableOpacity
                    onPress={updatePassword}
                    disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className={`py-4 rounded-full items-center mb-6 ${
                        loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword
                            ? 'bg-gray-300' 
                            : 'bg-blue-500'
                    }`}
                >
                    <Text className="text-white font-InterRegular text-base">
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </Text>
                </TouchableOpacity>

                {/* Forgot Password */}
                <View className="items-center mb-8">
                    <Text className="text-secondaryFont text-sm font-InterRegular mb-2">
                        Forgot your current password?
                    </Text>
                    <TouchableOpacity onPress={sendResetEmail}>
                        <Text className="text-blue-500 font-InterRegular">
                            Send reset email
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Security Tips */}
                <View className="p-4 bg-blue-50 rounded-lg">
                    <Text className="text-blue-600 text-sm font-InterRegular mb-2">
                        🔒 Security Tips:
                    </Text>
                    <Text className="text-blue-600 text-xs font-InterRegular">
                        • Use a unique password you don't use elsewhere{'\n'}
                        • Consider using a password manager{'\n'}
                        • Enable two-factor authentication for extra security{'\n'}
                        • Change your password regularly
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default PasswordScreen;
