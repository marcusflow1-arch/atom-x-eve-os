import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/error/ErrorToast';

export default function EngineCommandListener({ sceneApi }) {
  const queryClient = useQueryClient();
  const processedIds = useRef(new Set());

  // Poll for pending commands
  const { data: pendingCommands = [] } = useQuery({
    queryKey: ['engine-pending-commands'],
    queryFn: () => base44.entities.EngineChatMessage.filter({ status: 'pending' }),
    refetchInterval: 2000, // Check every 2s
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EngineChatMessage.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-pending-commands'] });
    }
  });

  const executeAction = async (action) => {
    if (!sceneApi) return;
    
    console.log('[EngineCommand] Executing:', action);

    try {
      if (action.type === 'add_primitive') {
        sceneApi.addPrimitive(action.data?.shape || 'cube', {
          position: action.data?.position,
          scale: action.data?.scale,
          color: action.data?.color
        });
      }
      else if (action.type === 'add_model' && action.data?.url) {
        await sceneApi.addModel(action.data.url, {
          position: action.data?.position,
          scale: action.data?.scale,
          animation_url: action.data?.animation_url
        });
      }
      else if (action.type === 'create_terrain') {
        sceneApi.createTerrain({
          size: action.data?.size || 50,
          color: action.data?.color,
          addFoliage: action.data?.addFoliage !== false
        });
      }
      else if (action.type === 'create_blueprint') {
        // Create blueprint entity if passed in data
        if (action.data?.name) {
           await base44.entities.EngineBlueprint.create({
             name: action.data.name,
             blueprint_type: action.data.blueprint_type || 'custom',
             description: action.data.description || '',
             nodes: action.data.nodes || [],
             variables: action.data.variables || [],
             generated_code: action.data.generated_code || '',
             is_active: false
           });
           showSuccess(`Created blueprint: ${action.data.name}`);
        }
      }
    } catch (err) {
      console.error('Action failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!sceneApi || pendingCommands.length === 0) return;

    const processCommands = async () => {
      for (const cmd of pendingCommands) {
        if (processedIds.current.has(cmd.id)) continue;
        processedIds.current.add(cmd.id);

        try {
          // Execute all actions in the command
          if (cmd.actions_taken && cmd.actions_taken.length > 0) {
            for (const action of cmd.actions_taken) {
              await executeAction(action);
            }
            showSuccess(`Executed command: ${cmd.content.substring(0, 30)}...`);
          }
          
          // Mark as executed
          updateStatusMutation.mutate({ id: cmd.id, status: 'executed' });
        } catch (error) {
          console.error('Command execution failed:', error);
          updateStatusMutation.mutate({ id: cmd.id, status: 'failed' });
          showError(`Command failed: ${cmd.content}`);
        }
      }
    };

    processCommands();
  }, [pendingCommands, sceneApi]);

  return null; // Invisible component
}