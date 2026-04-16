# chatbot/agents/investment_agent.py
from typing import Dict, Any, Tuple
from .base_agent import BaseAgent
from .dynamic_data import DynamicDataProvider

class InvestmentAgent(BaseAgent):
    """Specialized agent for investment advice"""
    
    def __init__(self):
        super().__init__(name="Investment Advisor", expertise="Property investment and ROI analysis")
        self.investment_keywords = ['invest', 'investment', 'roi', 'return', 'profit', 
                                    'yield', 'appreciation', 'rental income']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is an investment query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.investment_keywords:
            if keyword in message:
                score += 0.3
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide investment advice"""
        location = context.get('locations', [None])[0]
        
        if location:
            stats = DynamicDataProvider.get_location_stats(location)
            
            if stats['count'] > 0:
                reply = f"📈 **Investment Analysis: {location}**\n\n"
                reply += f"🏠 Active properties: {stats['count']}\n"
                reply += f"💰 Price range: UGX {stats['min_price']:,.0f} - {stats['max_price']:,.0f}\n"
                reply += f"📊 Average: UGX {stats['avg_price']:,.0f}\n\n"
                
                if stats['avg_price'] < 200_000_000:
                    reply += "💡 **Opportunity:** This area has affordable entry points. Great for first-time investors!\n"
                    reply += "📈 **Expected appreciation:** 10-15% annually\n"
                    reply += "🏠 **Best for:** Buy-and-hold, rental income"
                elif stats['avg_price'] < 500_000_000:
                    reply += "💡 **Opportunity:** Mid-range market with good liquidity.\n"
                    reply += "📈 **Expected appreciation:** 12-18% annually\n"
                    reply += "🏠 **Best for:** Capital growth, family homes"
                else:
                    reply += "💡 **Opportunity:** Premium location with strong demand.\n"
                    reply += "📈 **Expected appreciation:** 8-12% annually\n"
                    reply += "🏠 **Best for:** Luxury assets, long-term wealth"
            else:
                reply = f"I don't have enough data for {location}. Check out our popular investment areas!"
        else:
            # General investment advice
            popular = DynamicDataProvider.get_popular_locations(5)
            
            reply = "📈 **Property Investment Guide - Uganda**\n\n"
            reply += "**🔥 Top Investment Hotspots:**\n\n"
            
            for i, loc in enumerate(popular[:3], 1):
                stats = DynamicDataProvider.get_location_stats(loc)
                if stats['count'] > 0:
                    reply += f"{i}. **{loc}**\n"
                    reply += f"   • Average: UGX {stats['avg_price']:,.0f}\n"
                    reply += f"   • Active: {stats['count']} properties\n\n"
            
            reply += "💡 **Investment Tips:**\n"
            reply += "• Properties near new roads appreciate faster\n"
            reply += "• Student housing yields 10-15% ROI\n"
            reply += "• Look for areas with infrastructure development\n\n"
            reply += "**Ready to invest?** Let me find the best properties for you! 🚀"
        
        return {
            'success': True,
            'reply': reply,
            'agent_used': self.name,
            'suggestions': ['Show investment properties', 'Calculate ROI', 'Get full report'],
            'quick_replies': ['Show properties', 'Calculate ROI', 'Market report']
        }