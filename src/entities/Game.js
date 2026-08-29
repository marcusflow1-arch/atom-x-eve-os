import { base44 } from '@/api/base44Client';

export const Game = {
  list: (sortBy = '-created_date') => 
    base44.entities.Game.list(sortBy),
  
  create: (data) => 
    base44.entities.Game.create(data),
  
  update: (id, data) => 
    base44.entities.Game.update(id, data),
  
  delete: (id) => 
    base44.entities.Game.delete(id),
  
  filter: (filters, sortBy = '-created_date', limit = 100) => 
    base44.entities.Game.filter(filters, sortBy, limit)
};
