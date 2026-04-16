# chatbot/agents/construction_agent.py
from typing import Dict, Any, Tuple
from .base_agent import BaseAgent

class ConstructionAgent(BaseAgent):
    """Specialized agent for construction, renovation, and development"""
    
    def __init__(self):
        super().__init__(
            name="Construction Expert",
            expertise="Building costs, renovation estimates, and development advice"
        )
        self.construction_keywords = ['construction', 'build', 'renovation', 'contractor', 
                                      'architect', 'engineer', 'material', 'cost to build',
                                      'per square foot', 'development', 'site']
        
        # Construction cost estimates per square meter (Uganda - simplified)
        self.construction_costs = {
            'basic': {'min': 500_000, 'max': 800_000, 'description': 'Standard finishes, local materials'},
            'standard': {'min': 800_000, 'max': 1_200_000, 'description': 'Good finishes, mixed materials'},
            'premium': {'min': 1_200_000, 'max': 1_800_000, 'description': 'High-end finishes, imported materials'},
            'luxury': {'min': 1_800_000, 'max': 2_500_000, 'description': 'Luxury finishes, premium materials'}
        }
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a construction query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.construction_keywords:
            if keyword in message:
                score += 0.2
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide construction advice"""
        message = context.get('original', '').lower()
        
        # Check for size/area mention
        area = self._extract_area(message)
        
        if area:
            return self._calculate_construction_cost(area, context)
        elif any(word in message for word in ['renovation', 'remodel', 'upgrade']):
            return self._renovation_guide()
        elif any(word in message for word in ['contractor', 'builder', 'company']):
            return self._contractor_guide()
        else:
            return self._general_construction_guide()
    
    def _calculate_construction_cost(self, area: float, context: Dict) -> Dict[str, Any]:
        """Calculate construction cost based on area"""
        
        results = []
        
        for level, costs in self.construction_costs.items():
            min_cost = area * costs['min']
            max_cost = area * costs['max']
            
            results.append({
                'level': level.capitalize(),
                'cost_range': f"UGX {min_cost:,.0f} - {max_cost:,.0f}",
                'per_sqm': f"UGX {costs['min']:,.0f} - {costs['max']:,.0f}",
                'description': costs['description']
            })
        
        reply = f"🏗️ **Construction Cost Estimate - {area:,.0f} sqm**\n\n"
        
        for result in results:
            reply += f"**{result['level']} Level:**\n"
            reply += f"• Total cost: {result['cost_range']}\n"
            reply += f"• Per sqm: {result['per_sqm']}\n"
            reply += f"• {result['description']}\n\n"
        
        reply += "**💡 Cost-Saving Tips:**\n"
        reply += "• Source local materials (save 15-20%)\n"
        reply += "• Build during dry season (avoid delays)\n"
        reply += "• Use standard sizes (reduce waste)\n"
        reply += "• Hire a quantity surveyor\n\n"
        
        reply += "**⏱️ Estimated Timeline:**\n"
        reply += "• Foundation: 2-4 weeks\n"
        reply += "• Walling: 3-6 weeks\n"
        reply += "• Roofing: 2-3 weeks\n"
        reply += "• Finishing: 4-8 weeks\n"
        reply += "• Total: 3-6 months\n\n"
        
        reply += "Would you like me to connect you with verified contractors?"
        
        return {
            'success': True,
            'reply': reply,
            'cost_estimates': results,
            'suggestions': ['Find contractors', 'Material list', 'Timeline planner'],
            'quick_replies': ['Get contractors', 'Material costs', 'Timeline'],
            'agent_used': self.name
        }
    
    def _renovation_guide(self) -> Dict[str, Any]:
        """Guide on renovation costs and tips"""
        reply = """🔨 **Renovation Cost Guide - Uganda**

**🏠 Common Renovations & Costs:**

**Interior Painting:**
• Budget: UGX 5,000-10,000/sqm
• 3-bed house: UGX 1.5M - 3M

**Flooring:**
• Ceramic tiles: UGX 30,000-50,000/sqm
• Wooden floor: UGX 80,000-150,000/sqm
• 3-bed house: UGX 3M - 8M

**Kitchen Remodel:**
• Budget: UGX 5M - 15M
• Mid-range: UGX 15M - 30M
• Luxury: UGX 30M - 60M+

**Bathroom Renovation:**
• Budget: UGX 3M - 8M
• Standard: UGX 8M - 15M
• Luxury: UGX 15M - 30M+

**Roof Replacement:**
• Iron sheets: UGX 30,000-50,000/sqm
• Tiles: UGX 80,000-150,000/sqm
• 3-bed house: UGX 5M - 15M

**💡 ROI Tips:**
• Kitchen updates: 70-80% return
• Bathroom updates: 60-70% return
• Painting: 50-60% return
• Landscaping: 40-50% return

**✅ Before You Start:**
1. Get multiple quotes (3-5 contractors)
2. Check contractor licenses
3. Get written contracts
4. Plan for 20% contingency
5. Secure necessary permits

**Need renovation help?** I can recommend verified contractors!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Find contractor', 'Calculate costs', 'Permit guide'],
            'quick_replies': ['Get quotes', 'Materials', 'Contractors'],
            'agent_used': self.name
        }
    
    def _contractor_guide(self) -> Dict[str, Any]:
        """Guide on finding and hiring contractors"""
        reply = """👷 **How to Find & Hire Contractors**

**✅ Verified Contractors on PropertyHub:**
I can connect you with:
• Licensed builders
• Registered architects
• Certified engineers
• Quality surveyors

**📋 What to Ask Contractors:**

**Before Hiring:**
• License & registration number
• Portfolio of past projects
• References (call them!)
• Insurance coverage
• Warranty terms

**In the Contract:**
• Detailed scope of work
• Payment schedule
• Timeline with milestones
• Material specifications
• Penalty clauses for delays

**💰 Payment Tips:**
• Never pay 100% upfront
• 30% deposit maximum
• Link payments to milestones
• Hold 10% until completion

**⚠️ Red Flags:**
• No physical office
• Pressure for quick decision
• Cash-only payments
• No written contract
• Unusually low quotes

**🚀 Ready to start?** Tell me what you need built!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Find builders', 'Compare quotes', 'Check licenses'],
            'quick_replies': ['Find contractor', 'Get quotes', 'Check license'],
            'agent_used': self.name
        }
    
    def _general_construction_guide(self) -> Dict[str, Any]:
        """General construction guide"""
        reply = """🏗️ **Construction Guide - Uganda**

**I can help you with:**

💰 **Cost Estimates**
• Tell me the size in sqm
• Get detailed cost breakdowns
• Compare quality levels

🔨 **Renovation Advice**
• Kitchen/bathroom upgrades
• Painting and flooring
• Roofing and extensions

👷 **Find Contractors**
• Verified builders
• Licensed architects
• Certified engineers

📋 **Permits & Regulations**
• Building permits
• Environmental impact
• Safety requirements

**To get started:**
• "Cost to build 200 sqm house"
• "Renovate 3-bedroom house"
• "Find contractors near me"

**What would you like to know?**"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Calculate costs', 'Find builders', 'Permit guide'],
            'quick_replies': ['Cost estimate', 'Find builder', 'Renovation'],
            'agent_used': self.name
        }
    
    def _extract_area(self, message: str) -> float:
        """Extract area in square meters from message"""
        import re
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:sqm|square meters|square metres)',
            r'(\d+(?:\.\d+)?)\s*(?:house|property)\s*(?:of|size)',
            r'(\d+(?:\.\d+)?)\s*m²'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                return float(match.group(1))
        return None