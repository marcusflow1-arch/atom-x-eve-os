import React from 'react';

export default function GenreSelector({ equippedGenres = [], allGenres = [] }) {
    return (
        <div className="w-full bg-slate-900/50 border-t border-slate-700 p-2 flex items-center justify-center gap-4">
            <h4 className="text-sm font-semibold uppercase text-slate-400">Genre:</h4>
            <div className="flex gap-2">
                {equippedGenres.map(genre => (
                    <div key={genre} className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-3 py-1 rounded-md text-sm font-medium">
                        {genre}
                    </div>
                ))}
                {equippedGenres.length < 2 && (
                     <button className="bg-slate-700/50 border border-slate-600 border-dashed text-slate-500 px-3 py-1 rounded-md text-sm hover:bg-slate-700 hover:text-white">
                        + Equip Genre
                    </button>
                )}
            </div>
        </div>
    );
}