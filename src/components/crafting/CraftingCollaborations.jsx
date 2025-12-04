import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Hammer, Plus, CheckCircle, Circle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const mockProjects = [
  {
    id: 'proj_1',
    title: 'Guild Hall Fortress',
    description: 'Constructing a massive fortress for the "Iron Legion" guild.',
    initiator: 'GuildMaster_Thor',
    required_materials: [
      { name: 'Stone Blocks', quantity: 1000, current: 450 },
      { name: 'Iron Ingots', quantity: 500, current: 500 },
      { name: 'Obsidian', quantity: 50, current: 12 }
    ],
    contributors: 15,
    status: 'in_progress'
  },
  {
    id: 'proj_2',
    title: 'Mythic Dragon Slayer Sword',
    description: 'Pooling rare resources to forge a one-of-a-kind weapon.',
    initiator: 'Smithy_John',
    required_materials: [
      { name: 'Dragon Bone', quantity: 5, current: 2 },
      { name: 'Star Metal', quantity: 10, current: 3 },
      { name: 'Flux', quantity: 20, current: 20 }
    ],
    contributors: 4,
    status: 'planning'
  }
];

export default function CraftingCollaborations() {
  const [projects, setProjects] = useState(mockProjects);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleContribute = (projectId, materialName, amount) => {
    // Mock contribution logic
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const updatedMaterials = p.required_materials.map(m => {
          if (m.name === materialName) {
            return { ...m, current: Math.min(m.quantity, m.current + amount) };
          }
          return m;
        });
        return { ...p, required_materials: updatedMaterials };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Collaborative Crafting</h2>
          <p className="text-slate-400">Work together to build legendary items and structures.</p>
        </div>
        <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Start Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Start New Collaboration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project Title</Label>
                <Input className="bg-slate-800 border-slate-700" placeholder="e.g. Guild Airship" />
              </div>
              <div>
                <Label>Target Item</Label>
                <Input className="bg-slate-800 border-slate-700" placeholder="What are you making?" />
              </div>
              <Button className="w-full bg-indigo-600" onClick={() => setShowNewProject(false)}>Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(project => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                <p className="text-sm text-slate-400">by {project.initiator}</p>
              </div>
              <Badge className={project.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <p className="text-slate-300 text-sm mb-4">{project.description}</p>
            
            <div className="space-y-3 mb-4">
              {project.required_materials.map((mat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{mat.name}</span>
                    <span className="text-slate-400">{mat.current} / {mat.quantity}</span>
                  </div>
                  <Progress value={(mat.current / mat.quantity) * 100} className="h-2" />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <div className="flex items-center text-xs text-slate-400">
                <Users className="w-4 h-4 mr-1" /> {project.contributors} contributors
              </div>
              <Button size="sm" variant="outline" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                Contribute
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}