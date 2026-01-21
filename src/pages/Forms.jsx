import React, { useState } from 'react';
import UniversalFormContainer from '@/components/forms/UniversalFormContainer';
import FormStepRenderer from '@/components/forms/FormStepRenderer';
import FormFieldRenderer from '@/components/forms/FormFieldRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, CheckCircle2, Save } from 'lucide-react';

export default function FormsPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({});

    // Mock Form Object based on Section 1.2
    const mockForm = {
        formId: "clan-registration-v1",
        formName: "Clan Registration",
        formDescription: "Register a new clan in the Atom X Eve ecosystem. Requires level 10+.",
        formCategory: "application",
        isMultiStep: true,
        totalSteps: 3,
        formStatus: "active",
        requiresApproval: true,
        aiValidationEnabled: true,
        controllerNavigationEnabled: true,
        hapticFeedbackEnabled: true,
        soundFeedbackProfile: "sci-fi",
        animationStyle: "hologram",
        glassBlurIntensity: 40
    };

    // Mock Steps (Section 1.3)
    const mockSteps = [
        {
            stepId: "step-1",
            stepTitle: "Clan Identity",
            stepDescription: "Establish the core identity and branding of your new clan.",
            stepOrder: 1,
            isOptional: false,
            aiGuidanceEnabled: true
        },
        {
            stepId: "step-2",
            stepTitle: "Structure & Access",
            stepDescription: "Define hierarchy, recruitment policy, and base settings.",
            stepOrder: 2,
            isOptional: false,
            aiGuidanceEnabled: false
        },
        {
            stepId: "step-3",
            stepTitle: "Manifesto",
            stepDescription: "Declare your clan's purpose, goals, and rules.",
            stepOrder: 3,
            isOptional: true,
            aiGuidanceEnabled: true
        }
    ];

    // Mock Fields (Section 1.4)
    const mockFields = {
        "step-1": [
            {
                fieldId: "clan_name",
                stepId: "step-1",
                fieldLabel: "Clan Name",
                fieldType: "ai-assisted-input",
                placeholderText: "Enter a unique clan name...",
                helperText: "AI checks for uniqueness and banned terms automatically.",
                required: true,
                characterLimit: 32,
                aiEnhancementAllowed: true
            },
            {
                fieldId: "clan_tag",
                stepId: "step-1",
                fieldLabel: "Clan Tag",
                fieldType: "text",
                placeholderText: "TAG (e.g. [ATOM])",
                helperText: "Max 5 characters. Must be uppercase.",
                required: true,
                characterLimit: 5
            },
            {
                fieldId: "clan_banner",
                stepId: "step-1",
                fieldLabel: "Clan Banner",
                fieldType: "file-upload",
                helperText: "Upload a high-res banner image (1920x400).",
                required: false
            }
        ],
        "step-2": [
            {
                fieldId: "recruitment_status",
                stepId: "step-2",
                fieldLabel: "Recruitment Policy",
                fieldType: "dropdown",
                placeholderText: "Select recruitment status",
                options: [
                    { label: "Open to All", value: "open" },
                    { label: "Invite Only", value: "invite" },
                    { label: "Closed", value: "closed" }
                ],
                required: true
            },
            {
                fieldId: "min_level",
                stepId: "step-2",
                fieldLabel: "Minimum Level Requirement",
                fieldType: "slider",
                minValue: 1,
                maxValue: 100,
                defaultValue: 10,
                required: true
            },
            {
                fieldId: "voice_required",
                stepId: "step-2",
                fieldLabel: "Voice Chat Required",
                fieldType: "toggle",
                required: false,
                defaultValue: false
            }
        ],
        "step-3": [
            {
                fieldId: "manifesto_text",
                stepId: "step-3",
                fieldLabel: "Clan Manifesto",
                fieldType: "textarea",
                placeholderText: "Write your clan's declaration...",
                helperText: "Use this space to inspire potential members.",
                required: true,
                characterLimit: 500,
                aiEnhancementAllowed: true
            },
            {
                fieldId: "audio_intro",
                stepId: "step-3",
                fieldLabel: "Audio Introduction",
                fieldType: "voice-input",
                helperText: "Record a short voice message for your clan profile.",
                required: false
            },
            {
                fieldId: "agree_terms",
                stepId: "step-3",
                fieldLabel: "I agree to the Community Guidelines",
                fieldType: "checkbox",
                required: true
            }
        ]
    };

    const handleFieldChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < mockSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1419]" style={{ 
            backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}>
            {/* Overlay to darken background */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 pt-20 pb-20">
                <UniversalFormContainer
                    pageId="clan-application-page"
                    pageTitle="Clan Registration"
                    pageSubtitle="Begin your legacy in Atom X Eve. Create your clan."
                    pageType="clan"
                    visualTheme="liquid-glass"
                    platformMode="desktop"
                    accessLevel="member"
                    aiAssistanceEnabled={true}
                    autosaveEnabled={true}
                    versioningEnabled={true}
                    glassBlurIntensity={mockForm.glassBlurIntensity}
                    animationStyle={mockForm.animationStyle}
                >
                    <div className="flex flex-col gap-6">
                        
                        {/* Form Header Info */}
                        <div className="flex items-start justify-between border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{mockForm.formName}</h2>
                                <p className="text-white/60">{mockForm.formDescription}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 uppercase tracking-wider text-[10px]">
                                    {mockForm.formStatus}
                                </Badge>
                                <div className="text-xs text-white/40 font-mono">
                                    ID: {mockForm.formId}
                                </div>
                            </div>
                        </div>

                        {/* Steps Indicator */}
                        {mockForm.isMultiStep && (
                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    {mockSteps.map((step, i) => (
                                        <div key={step.stepId} className="flex-1 flex flex-col gap-2 cursor-pointer group" onClick={() => setCurrentStep(i)}>
                                            <div className="h-1 rounded-full bg-white/10 overflow-hidden relative">
                                                <div 
                                                    className={`absolute inset-0 bg-cyan-400 transition-all duration-500 ease-out`}
                                                    style={{ 
                                                        width: i < currentStep ? '100%' : i === currentStep ? '50%' : '0%'
                                                    }} 
                                                />
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${i === currentStep ? 'text-cyan-400' : i < currentStep ? 'text-white/60' : 'text-white/20'}`}>
                                                Step {step.stepOrder}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Current Step Rendering */}
                        <div className="min-h-[400px]">
                            {mockSteps.map((step, index) => (
                                <FormStepRenderer 
                                    key={step.stepId} 
                                    step={step} 
                                    isActive={index === currentStep}
                                >
                                    <div className="grid gap-6">
                                        {mockFields[step.stepId]?.map(field => (
                                            <FormFieldRenderer
                                                key={field.fieldId}
                                                field={field}
                                                value={formData[field.fieldId]}
                                                onChange={handleFieldChange}
                                            />
                                        ))}
                                    </div>
                                </FormStepRenderer>
                            ))}
                        </div>

                        {/* Footer / Navigation */}
                        <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-4">
                            <Button 
                                variant="ghost" 
                                onClick={prevStep} 
                                disabled={currentStep === 0}
                                className="text-white/60 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white/60">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Draft
                                </Button>
                                
                                {currentStep < mockSteps.length - 1 ? (
                                    <Button 
                                        onClick={nextStep}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                                    >
                                        Next Step
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button 
                                        className="bg-green-500 hover:bg-green-400 text-black font-bold"
                                    >
                                        Complete Registration
                                        <CheckCircle2 className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Form Metadata Badges */}
                        <div className="flex gap-4 mt-2">
                            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-white/60">
                                {mockForm.formCategory}
                            </Badge>
                            {mockForm.requiresApproval && (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20">
                                    Requires Approval
                                </Badge>
                            )}
                            {mockForm.aiValidationEnabled && (
                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
                                    AI Validation On
                                </Badge>
                            )}
                        </div>

                    </div>
                </UniversalFormContainer>
            </div>
        </div>
    );
}