import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { ThumbsUp, MessageSquare, Share2, MapPin, AlertCircle, Users } from 'lucide-react';

export function SocialFeed() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/community')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-2xl text-green-600 shadow-sm">
                <Users size={32} strokeWidth={1.5} />
            </div>
            <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Farming Community</h2>
                <p className="text-gray-500">Connect with local farmers and experts.</p>
            </div>
        </div>
        <button className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all">
          Post Update
        </button>
      </div>

      <div className="space-y-6">
        {posts.map((post, i) => (
          <Card key={i} className={`transition-all hover:shadow-md ${post.type === 'alert' ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}`}>
            <div className="flex gap-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0
                ${post.type === 'alert' ? 'bg-red-500' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
                {post.user.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{post.user}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {post.location}</span>
                      <span>•</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                  {post.type === 'alert' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 border border-red-200">
                      <AlertCircle size={12} /> Alert
                    </span>
                  )}
                </div>
                
                <p className="text-gray-800 mt-3 leading-relaxed">{post.content}</p>
                
                <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm font-medium transition-colors">
                    <ThumbsUp size={18} /> {post.likes} Likes
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                    <MessageSquare size={18} /> {post.comments} Comments
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium ml-auto transition-colors">
                    <Share2 size={18} /> Share
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
