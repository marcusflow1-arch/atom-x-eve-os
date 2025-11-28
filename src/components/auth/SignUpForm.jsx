import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Calendar, Users, Camera, AtSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { User as UserEntity } from '@/entities/User';
import { base44 } from '@/api/base44Client';

export default function SignUpForm({ onComplete, onCancel }) {
    const [formData, setFormData] = useState({
        username: '',
        age: '',
        gender: '',
        avatar_url: '',
        bio: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.age || formData.age < 13) {
            newErrors.age = 'Age must be 13 or older';
        }
        
        if (!formData.gender) {
            newErrors.gender = 'Please select your gender';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Determine Archetype using AI
            let archetype = 'Neutral';
            if (formData.bio) {
                try {
                    const aiResponse = await base44.integrations.Core.InvokeLLM({
                        prompt: `Analyze this gaming bio: "${formData.bio}". If it mentions killing, winning, or stats, output "Atom". If it mentions story, friends, or beauty, output "Eve". If unclear, output "Neutral". Only output the single word.`,
                    });
                    const text = aiResponse.trim();
                    if (['Atom', 'Eve'].includes(text)) {
                        archetype = text;
                    }
                } catch (aiError) {
                    console.error('AI Archetype analysis failed, defaulting to Neutral', aiError);
                }
            }

            const finalData = {
                ...formData,
                age: parseInt(formData.age),
                archetype: archetype,
                is_first_time: false,
                last_login: new Date().toISOString()
            };

            // Update user data with signup info
            await UserEntity.updateMyUserData(finalData);
            
            onComplete(finalData);
        } catch (error) {
            console.error('Signup failed:', error);
            setErrors({ submit: 'Failed to create profile. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Welcome to Atom X Eve
                    </h1>
                    <p className="text-slate-400">Complete your profile to begin your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                                maxLength={20}
                            />
                        </div>
                        {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                type="number"
                                placeholder="Your age"
                                value={formData.age}
                                onChange={(e) => handleInputChange('age', e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                                min="13"
                                max="120"
                            />
                        </div>
                        {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
                    </div>

                    <div>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <Camera className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Avatar URL (optional)"
                                value={formData.avatar_url}
                                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <Textarea
                            placeholder="What is your favorite gaming moment? (Determines your Archetype)"
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            className="bg-slate-800/50 border-slate-600 text-white"
                            rows={3}
                            maxLength={200}
                        />
                    </div>

                    {errors.submit && (
                        <p className="text-red-400 text-sm text-center">{errors.submit}</p>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            Skip for Now
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? 'Creating...' : 'Complete Setup'}
                        </Button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}