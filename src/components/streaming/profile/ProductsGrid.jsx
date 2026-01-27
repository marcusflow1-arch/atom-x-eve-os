import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Tag, ShoppingBag, Calendar, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProductsGrid({ allowEditing = true }) {
  const [isEditingState, setIsEditingState] = useState(false);
  const isEditing = isEditingState && allowEditing;
  const [products, setProducts] = useState([
    {
      id: 1,
      title: 'Official Aura Hoodie',
      price: '$59.99',
      description: 'Limited edition season 0 hoodie with embroidered logo.',
      image: 'https://source.unsplash.com/random/400x400?hoodie,black',
      type: 'product'
    },
    {
      id: 2,
      title: '1-on-1 Coaching',
      price: '$120.00',
      description: '1 hour coaching session for FPS games.',
      image: 'https://source.unsplash.com/random/400x400?gaming,headset',
      type: 'event'
    },
    {
      id: 3,
      title: 'Signed Poster',
      price: '$25.00',
      description: 'A3 High gloss poster signed live on stream.',
      image: 'https://source.unsplash.com/random/400x400?poster,art',
      type: 'product'
    },
    {
      id: 4,
      title: 'Community Game Night',
      price: 'Free',
      description: 'Join us for Among Us this Friday! Ticket required.',
      image: 'https://source.unsplash.com/random/400x400?party,games',
      type: 'event'
    },
    {
        id: 5,
        title: 'Digital Asset Pack',
        price: '$15.00',
        description: 'Stream overlays and emotes for your own channel.',
        image: 'https://source.unsplash.com/random/400x400?digital,design',
        type: 'product'
      }
  ]);

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), title: '', price: '', description: '', image: '', type: 'product' }]);
  };

  const removeProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="w-full mt-12 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Available Products & Events
            {isEditing && <span className="text-sm font-normal text-white/40">(Edit Mode)</span>}
            </h3>
            {allowEditing && (
                <button 
                    onClick={() => setIsEditingState(!isEditing)}
                    className={`p-2 rounded-full transition-all ${isEditing ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
        {isEditing && (
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={addProduct}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
        )}
      </div>

      {isEditing ? (
        // EDIT MODE: Grid of inputs
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 relative group">
                    <div className="aspect-video bg-black/40 rounded-lg mb-3 flex items-center justify-center border border-white/5 overflow-hidden relative">
                         {product.image ? (
                             <img src={product.image} className="w-full h-full object-cover" />
                         ) : (
                             <ShoppingBag className="w-8 h-8 text-white/20" />
                         )}
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-xs text-white underline cursor-pointer">Change Image</span>
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Input 
                            value={product.title} 
                            onChange={(e) => updateProduct(product.id, 'title', e.target.value)}
                            placeholder="Title"
                            className="h-8 bg-black/20 border-white/10 text-sm font-bold"
                        />
                        <div className="flex gap-2">
                            <Input 
                                value={product.price} 
                                onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                                placeholder="Price"
                                className="h-8 bg-black/20 border-white/10 text-sm w-1/2"
                            />
                             <select 
                                value={product.type}
                                onChange={(e) => updateProduct(product.id, 'type', e.target.value)}
                                className="h-8 bg-black/20 border border-white/10 text-xs w-1/2 rounded-md px-2 text-white"
                             >
                                 <option value="product">Product</option>
                                 <option value="event">Event</option>
                             </select>
                        </div>
                        <Textarea 
                            value={product.description}
                            onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="bg-black/20 border-white/10 text-xs min-h-[60px]"
                        />
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                        onClick={() => removeProduct(product.id)}
                    >
                        Remove
                    </Button>
                </div>
            ))}
            
            {/* Add New Placeholder */}
            <div 
                onClick={addProduct}
                className="bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors min-h-[250px]"
            >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-sm font-medium text-white/60">Add Item</span>
            </div>
        </div>
      ) : (
        // VIEW MODE: Horizontal Scroll
        <div className="w-full overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
            <div className="flex gap-4 w-max">
                {products.map((product) => (
                    <motion.div 
                        key={product.id}
                        whileHover={{ y: -5 }}
                        className="w-[240px] bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-lg hover:shadow-cyan-500/5 group cursor-pointer"
                    >
                        <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-black/60 backdrop-blur-md border border-white/10 text-white">
                                    {product.price}
                                </Badge>
                            </div>
                            <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className={`text-[10px] h-5 ${product.type === 'event' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    {product.type === 'event' ? 'Event' : 'Product'}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="text-white font-bold mb-1 truncate">{product.title}</h4>
                            <p className="text-white/50 text-xs line-clamp-2 h-8 leading-relaxed mb-4">{product.description}</p>
                            <Button className="w-full h-8 text-xs font-bold bg-white text-black hover:bg-slate-200">
                                {product.type === 'event' ? 'Get Tickets' : 'Buy Now'}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}