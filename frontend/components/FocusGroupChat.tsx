"use client";

import { motion } from "framer-motion";
import { User, MessageSquare, Star, ThumbsUp, ThumbsDown, UserCheck } from "lucide-react";

interface Review {
    persona: string;
    age_group: string;
    rating: float;
    comment: string;
    sentiment: "positive" | "neutral" | "negative";
}

interface FocusGroupChatProps {
    reviews: Review[];
    overallSentiment: string;
    improvementSuggestion: string;
}

export default function FocusGroupChat({ reviews, overallSentiment, improvementSuggestion }: FocusGroupChatProps) {
    return (
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <UserCheck className="w-6 h-6" /> AI 가상 시식회
                    </h3>
                    <p className="text-white/80 text-sm mt-1">5명의 AI 페르소나가 솔직하게 평가 중입니다...</p>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <div className="text-xs uppercase opacity-70 mb-1">Overall Sentiment</div>
                    <div className="font-bold">{overallSentiment}</div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-orange-50/30 custom-scrollbar">
                {reviews.map((review, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.8 }} // Staggered chat appearance
                        className={`flex gap-4 ${index % 2 === 0 ? '' : 'flex-row-reverse'}`}
                    >
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md
                                ${review.sentiment === 'positive' ? 'bg-green-500' :
                                    review.sentiment === 'neutral' ? 'bg-orange-400' : 'bg-red-400'}`}>
                                {review.persona[0]}
                            </div>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 font-medium whitespace-nowrap">
                                {review.age_group}
                            </span>
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm border border-orange-100/50 relative
                            ${review.sentiment === 'positive' ? 'bg-white' :
                                review.sentiment === 'neutral' ? 'bg-white' : 'bg-red-50'}`}>

                            <div className="flex items-center justify-between mb-2 gap-4">
                                <span className="font-bold text-gray-800 text-sm">{review.persona}</span>
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(review.rating) ? 'fill-current' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-700 text-sm leading-relaxed">
                                {review.comment}
                            </p>

                            {/* Sentiment Icon */}
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border shadow-sm">
                                {review.sentiment === 'positive' && <ThumbsUp className="w-3 h-3 text-green-500" />}
                                {review.sentiment === 'negative' && <ThumbsDown className="w-3 h-3 text-red-500" />}
                                {review.sentiment === 'neutral' && <MessageSquare className="w-3 h-3 text-gray-400" />}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer / Action */}
            <div className="p-6 bg-white border-t border-orange-100">
                <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-100 flex gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg h-fit">
                        <UserCheck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-orange-900 text-sm mb-1">AI의 개선 제안</h4>
                        <p className="text-orange-700 text-sm">{improvementSuggestion}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
