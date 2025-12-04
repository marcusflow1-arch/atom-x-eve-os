import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ThumbsUp, MessageSquare, Code, Rocket, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const mockConcepts = [
  {
    id: 'concept_1',
    title: 'Neon Racers: Overdrive',
    author: 'CyberPunk_Fan',
    description: 'A high-speed racing game set in a procedurally generated neon city. Players can build their own tracks.',
    votes: 1240,
    status: 'voting',
    tags: ['Racing', 'Sci-Fi', 'UGC'],
    comments: 45
  },
  {
    id: 'concept_2',
    title: 'Forest Guardians',
    author: 'NatureLover',
    description: 'Co-op survival game where players play as spirits protecting an ancient forest from industrialization.',
    votes: 850,
    status: 'in_development',
    tags: ['Survival', 'Co-Op', 'Fantasy'],
    comments: 32
  }
];

export default function GameDevHub() {
  const [concepts, setConcepts] = useState(mockConcepts);
  const [newConcept, setNewConcept] = useState({ title: '', description: '', tags: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVote = (id) => {
    setConcepts(concepts.map(c => c.id === id ? { ...c, votes: c.votes + 1 } : c));
  };

  const handleSubmit = () => {
    const concept = {
      id: `concept_${Date.now()}`,
      title: newConcept.title,
      author: 'Current_User', // Mock
      description: newConcept.description,
      votes: 0,
      status: 'proposed',
      tags: newConcept.tags.split(',').map(t => t.trim()),
      comments: 0
    };
    setConcepts([concept, ...concepts]);
    setIsDialogOpen(false);
    setNewConcept({ title: '', description: '', tags: '' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Rocket className="w-10 h-10 text-purple-500" />
              Game Dev Hub
            </h1>
            <p className="text-slate-400 mt-2">Co-create the next generation of games on Atom XE.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-lg px-6 py-6">
                <Lightbulb className="w-5 h-5 mr-2" /> Propose Concept
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Propose a New Game Concept</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input 
                  placeholder="Game Title" 
                  value={newConcept.title}
                  onChange={e => setNewConcept({...newConcept, title: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
                <Textarea 
                  placeholder="Describe your game mechanics, story, and unique features..." 
                  value={newConcept.description}
                  onChange={e => setNewConcept({...newConcept, description: e.target.value})}
                  className="bg-slate-800 border-slate-700 min-h-[150px]"
                />
                <Input 
                  placeholder="Tags (comma separated)" 
                  value={newConcept.tags}
                  onChange={e => setNewConcept({...newConcept, tags: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
                <Button onClick={handleSubmit} className="w-full bg-purple-600">Submit Proposal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {concepts.map(concept => (
              <motion.div 
                key={concept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 p-6 hover:border-purple-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">{concept.title}</h2>
                        <Badge variant="outline" className={
                          concept.status === 'in_development' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }>
                          {concept.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">Proposed by <span className="text-purple-400">{concept.author}</span></p>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="flex flex-col items-center h-auto py-2 hover:bg-purple-500/10 hover:text-purple-400"
                      onClick={() => handleVote(concept.id)}
                    >
                      <ThumbsUp className="w-6 h-6 mb-1" />
                      <span className="font-bold">{concept.votes}</span>
                    </Button>
                  </div>

                  <p className="text-slate-300 mb-6 leading-relaxed">{concept.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {concept.tags.map(tag => (
                        <Badge key={tag} className="bg-slate-800 text-slate-400 border-slate-700">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="border-slate-700">
                        <MessageSquare className="w-4 h-4 mr-2" /> {concept.comments} Discuss
                      </Button>
                      {concept.status === 'in_development' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Code className="w-4 h-4 mr-2" /> Contribute
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-yellow-500" /> Community Milestones
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Neon Racers Beta</span>
                    <span className="text-slate-400">85%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Forest Guardians Concept Art</span>
                    <span className="text-slate-400">40%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[40%]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-2">Dev Kits Available</h3>
              <p className="text-sm text-slate-400 mb-4">Download the latest Atom XE asset packs and SDKs to start building.</p>
              <Button className="w-full bg-slate-800 hover:bg-slate-700">Access Dev Portal</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}