import React from 'react';
import { useGlobalModels } from './GlobalModelsContext';
import { Button } from '@/components/ui/button';
import { Box, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ModelSelector({ className = '' }) {
  const { models, activeModel, setActiveModelId } = useGlobalModels();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Box className="w-4 h-4" />
          {activeModel ? activeModel.name : 'Select 3D Model'}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => setActiveModelId(null)}>
          <span className="text-slate-500">None</span>
        </DropdownMenuItem>
        {models.map((model) => (
          <DropdownMenuItem 
            key={model.id} 
            onClick={() => setActiveModelId(model.id)}
            className={activeModel?.id === model.id ? 'bg-blue-500/10' : ''}
          >
            <Box className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">{model.name}</p>
              <p className="text-xs text-slate-500">{model.file_type?.toUpperCase()}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}