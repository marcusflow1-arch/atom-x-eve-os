
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Send, Bot, LifeBuoy, ChevronDown } from 'lucide-react';
// Removed PayPal imports that were causing the error

const faqData = [
    {
        question: "What is AdamXEve OS?",
        answer: "AdamXEve OS is a next-generation symbiotic gaming platform. It's more than just a launcher; it's a living ecosystem where your gameplay, achievements, and choices shape an evolving narrative and a personalized experience powered by AI."
    },
    {
        question: "How do I add a game to my library?",
        answer: "You can purchase games from our integrated Store. Once a purchase is successfully completed, the game will automatically be added to your Library, ready for you to download and play."
    },
    {
        question: "Can I get a refund?",
        answer: "We offer refunds on games played for less than two hours within 14 days of purchase. Please visit our (future) refund policy page or contact support with your order details."
    },
    {
        question: "What are AGP (Avatar Gamer Points)?",
        answer: "AGP are points you earn by unlocking achievements. These points can be used to level up your avatar and will be integrated into the upcoming Black Market and other features."
    },
    {
        question: "How do I edit my profile?",
        answer: "You can edit your username, bio, and avatar by navigating to the Profile page from the main menu. Make your changes and hit 'Save'!"
    }
];

// Removed paypalOptions constant

export default function AdamXEveSupportPage() {
    const [formState, setFormState] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormState(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');
        // In a real app, this would call a backend function to send an email or create a ticket.
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setSubmitMessage('Your message has been sent! Our support team will get back to you shortly.');
        setFormState({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitMessage(''), 5000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white page-container">
            <style>{`
            /* Add any global styles here if needed by the new structure */
            `}</style>

            <div className="relative isolate overflow-hidden pt-14">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <header className="text-center mb-12">
                        <LifeBuoy className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">Support Center</h1>
                        <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
                            Need help? Find answers to common questions or get in touch with our support team.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* FAQ Section */}
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {faqData.map((item, index) => (
                                    <AccordionItem key={index} value={`item-${index}`} className="bg-slate-800/50 border border-slate-700 rounded-lg mb-3">
                                        <AccordionTrigger className="p-4 text-left font-semibold text-slate-200 hover:no-underline">
                                            {item.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 pt-0 text-slate-400">
                                            {item.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        {/* Contact Form Section */}
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Contact Support</h2>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                                        <Input id="name" type="text" value={formState.name} onChange={handleInputChange} required className="w-full bg-slate-700 border-slate-600" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Your Email</label>
                                        <Input id="email" type="email" value={formState.email} onChange={handleInputChange} required className="w-full bg-slate-700 border-slate-600" />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                                        <Textarea id="message" value={formState.message} onChange={handleInputChange} required rows={5} className="w-full bg-slate-700 border-slate-600" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting ? 'Sending...' : 'Send Message'}
                                            <Send className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                    {submitMessage && <p className="text-sm text-green-400 mt-4">{submitMessage}</p>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
