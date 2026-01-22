import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, Sparkles, Upload, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const FormFieldRenderer = ({ field, value, onChange, error, disabled = false }) => {
    
    // Helper to handle simple change events
    const handleChange = (val) => {
        if (!disabled) {
            onChange(field.fieldId, val);
        }
    };

    const renderInput = () => {
        switch (field.fieldType) {
            case 'text':
            case 'ai-assisted-input':
                return (
                    <div className="relative">
                        <Input 
                            placeholder={field.placeholderText}
                            value={value || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            maxLength={field.characterLimit}
                            disabled={disabled}
                            className={cn(
                                "bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 transition-all",
                                field.fieldType === 'ai-assisted-input' && "pr-10",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        {field.fieldType === 'ai-assisted-input' && (
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors p-1">
                                <Sparkles className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <Textarea 
                        placeholder={field.placeholderText}
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        maxLength={field.characterLimit}
                        disabled={disabled}
                        className={cn(
                            "bg-black/20 border-white/10 text-white placeholder:text-white/20 min-h-[120px] focus:border-cyan-500/50 transition-all resize-none",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    />
                );

            case 'number':
                return (
                    <Input 
                        type="number"
                        placeholder={field.placeholderText}
                        value={value || ''}
                        onChange={(e) => handleChange(Number(e.target.value))}
                        min={field.minValue}
                        max={field.maxValue}
                        disabled={disabled}
                        className={cn(
                            "bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 w-full",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    />
                );

            case 'slider':
                return (
                    <div className={cn("py-2 px-1", disabled && "opacity-50 pointer-events-none")}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/40 font-mono">{field.minValue || 0}</span>
                            <span className="text-sm font-bold text-cyan-400 font-mono">{value || (field.minValue || 0)}</span>
                            <span className="text-xs text-white/40 font-mono">{field.maxValue || 100}</span>
                        </div>
                        <Slider 
                            value={[value || field.minValue || 0]}
                            min={field.minValue || 0}
                            max={field.maxValue || 100}
                            step={1}
                            onValueChange={(vals) => handleChange(vals[0])}
                            disabled={disabled}
                            className="cursor-pointer"
                        />
                    </div>
                );

            case 'dropdown':
                return (
                    <Select value={value} onValueChange={handleChange} disabled={disabled}>
                        <SelectTrigger className={cn("bg-black/20 border-white/10 text-white", disabled && "opacity-50 cursor-not-allowed")}>
                            <SelectValue placeholder={field.placeholderText || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                            {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'toggle':
                return (
                    <div className={cn("flex items-center gap-3", disabled && "opacity-50")}>
                        <Switch 
                            checked={!!value}
                            onCheckedChange={handleChange}
                            disabled={disabled}
                            className="data-[state=checked]:bg-cyan-500"
                        />
                        <span className="text-sm text-white/60">
                            {value ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                );

            case 'checkbox':
                return (
                    <div className={cn("flex items-center space-x-2", disabled && "opacity-50")}>
                        <Checkbox 
                            id={field.fieldId} 
                            checked={!!value}
                            onCheckedChange={handleChange}
                            disabled={disabled}
                            className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                        <label
                            htmlFor={field.fieldId}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/80"
                        >
                            {field.placeholderText || "Confirm selection"}
                        </label>
                    </div>
                );

            case 'voice-input':
                return (
                    <div className={cn("flex gap-2", disabled && "opacity-50")}>
                        <div className="relative flex-1">
                            <Input 
                                value={value || ''}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder="Press microphone to speak..."
                                disabled={disabled}
                                className="bg-black/20 border-white/10 text-white pl-10"
                            />
                            <Mic className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        </div>
                        <Button 
                            variant="outline" 
                            disabled={disabled}
                            className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
                        >
                            <Mic className="w-4 h-4" />
                        </Button>
                    </div>
                );

            case 'file-upload':
                return (
                    <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                            <Upload className="w-5 h-5 text-white/40" />
                        </div>
                        <p className="text-sm text-white/60 font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-white/30">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                );

            default:
                return <div className="text-red-500 text-xs">Unsupported field type: {field.fieldType}</div>;
        }
    };

    return (
        <div className="flex flex-col gap-2 group">
            {/* Label Row */}
            <div className="flex items-center justify-between">
                <Label className="text-white/90 font-medium flex items-center gap-2">
                    {field.fieldLabel}
                    {field.required && <span className="text-red-400 text-xs">*</span>}
                    {field.aiEnhancementAllowed && (
                        <Sparkles className="w-3 h-3 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                </Label>
                
                {field.characterLimit && field.fieldType === 'textarea' && (
                    <span className="text-[10px] text-white/30 font-mono">
                        {(value?.length || 0)} / {field.characterLimit}
                    </span>
                )}
            </div>

            {/* Input Component */}
            {renderInput()}

            {/* Helper / Error Text */}
            <div className="flex justify-between items-start min-h-[20px]">
                {field.helperText && !error && (
                    <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                        <Info className="w-3 h-3" />
                        {field.helperText}
                    </p>
                )}
                
                {error && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FormFieldRenderer;