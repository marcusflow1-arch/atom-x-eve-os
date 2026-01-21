import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Info, Sparkles, AlertCircle } from 'lucide-react';

const FormStepRenderer = ({ 
    step, 
    isActive, 
    isCompleted,
    children 
}) => {
    if (!isActive && !isCompleted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                "flex flex-col gap-6",
                isActive ? "block" : "hidden"
            )}
        >
            {/* Step Header */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-wide">
                        {step.stepTitle}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                        {step.isOptional && (
                            <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                Optional
                            </span>
                        )}
                        {step.aiGuidanceEnabled && (
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full">
                                <Sparkles className="w-3 h-3" />
                                <span>AI Guided</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {step.stepDescription && (
                    <p className="text-white/60 text-sm leading-relaxed">
                        {step.stepDescription}
                    </p>
                )}
            </div>

            {/* Step Content (Fields) */}
            <div className="space-y-6">
                {children}
            </div>
        </motion.div>
    );
};

export default FormStepRenderer;