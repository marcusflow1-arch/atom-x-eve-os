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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <div className="w-full max-w-md bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
                {/* Liquid Glass Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-light text-white tracking-wider mb-2">Initialize Profile</h1>
                    <p className="text-white/40 text-sm">Begin your journey in the Nexus</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1 font-bold">Identity</label>
                        <Input
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-white/5 h-12 rounded-xl backdrop-blur-sm transition-all"
                            maxLength={20}
                        />
                         {errors.username && <p className="text-red-400 text-xs mt-1 ml-1">{errors.username}</p>}
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                             <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1 font-bold">Level</label>
                             <Input
                                type="number"
                                placeholder="Age"
                                value={formData.age}
                                onChange={(e) => handleInputChange('age', e.target.value)}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-white/5 h-12 rounded-xl backdrop-blur-sm"
                                min="13"
                                max="120"
                             />
                             {errors.age && <p className="text-red-400 text-xs mt-1 ml-1">{errors.age}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1 font-bold">Model</label>
                            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white h-12 rounded-xl backdrop-blur-sm hover:bg-white/5 transition-all">
                                    <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900/90 border-white/10 backdrop-blur-xl text-white">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && <p className="text-red-400 text-xs mt-1 ml-1">{errors.gender}</p>}
                        </div>
                    </div>

                    {/* Avatar URL (Optional - kept simple) */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1 font-bold">Avatar Source</label>
                        <Input
                            placeholder="Image URL (Optional)"
                            value={formData.avatar_url}
                            onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-white/5 h-12 rounded-xl backdrop-blur-sm"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1 font-bold">Origin Story</label>
                         <Textarea
                            placeholder="What defines your gaming legacy?"
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-white/5 rounded-xl resize-none min-h-[100px] backdrop-blur-sm"
                            rows={3}
                            maxLength={200}
                        />
                        <p className="text-[10px] text-white/30 text-right">{formData.bio.length}/200</p>
                    </div>

                    {errors.submit && (
                        <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{errors.submit}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onCancel}
                            className="flex-1 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            Skip
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] bg-white text-black hover:bg-white/90 rounded-xl font-bold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02]"
                        >
                            {isSubmitting ? 'Processing...' : 'Initialize'}
                        </Button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}