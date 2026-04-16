# chatbot/agents/mortgage_agent.py
from typing import Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime
from .base_agent import BaseAgent

class MortgageAgent(BaseAgent):
    """Specialized agent for mortgage calculations and financing advice"""
    
    def __init__(self):
        super().__init__(
            name="Mortgage Expert",
            expertise="Home loans, mortgage calculations, and financing options"
        )
        self.mortgage_keywords = ['mortgage', 'loan', 'financing', 'bank', 'interest', 
                                  'payment', 'monthly payment', 'afford', 'down payment',
                                  'finance', 'credit', 'bank loan']
        
        # Ugandan bank rates (simplified - update with real data)
        self.bank_rates = {
            'Stanbic': {'rate': 0.18, 'max_term': 20, 'min_down_payment': 0.20},
            'Centenary': {'rate': 0.17, 'max_term': 20, 'min_down_payment': 0.15},
            'DFCU': {'rate': 0.19, 'max_term': 20, 'min_down_payment': 0.20},
            'Equity': {'rate': 0.165, 'max_term': 25, 'min_down_payment': 0.15},
            'Absa': {'rate': 0.185, 'max_term': 20, 'min_down_payment': 0.20},
        }
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a mortgage/financing query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.mortgage_keywords:
            if keyword in message:
                score += 0.2
        
        # Check for numbers that might be loan amounts
        if any(char.isdigit() for char in message) and ('million' in message or 'billion' in message):
            score += 0.3
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate mortgage and provide financing advice"""
        message = context.get('original', '')
        
        # Extract property price if mentioned
        property_price = self._extract_price(message)
        
        # If no price mentioned, ask for it
        if not property_price and context.get('last_property'):
            property_price = context['last_property'].get('price')
        
        if property_price:
            return self._calculate_mortgage_options(property_price, context)
        else:
            return self._mortgage_guide()
    
    def _calculate_mortgage_options(self, property_price: float, context: Dict) -> Dict[str, Any]:
        """Calculate mortgage options for a property"""
        
        results = []
        
        for bank_name, terms in self.bank_rates.items():
            # Calculate down payment
            down_payment_min = property_price * terms['min_down_payment']
            loan_amount = property_price - down_payment_min
            
            # Calculate monthly payment (simplified)
            monthly_rate = terms['rate'] / 12
            num_payments = terms['max_term'] * 12
            monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
            
            # Calculate total interest
            total_payment = monthly_payment * num_payments
            total_interest = total_payment - loan_amount
            
            results.append({
                'bank': bank_name,
                'interest_rate': f"{terms['rate'] * 100:.1f}%",
                'max_term': f"{terms['max_term']} years",
                'min_down_payment': f"UGX {down_payment_min:,.0f} ({terms['min_down_payment'] * 100:.0f}%)",
                'estimated_monthly': f"UGX {monthly_payment:,.0f}",
                'total_interest': f"UGX {total_interest:,.0f}"
            })
        
        # Sort by monthly payment
        results.sort(key=lambda x: float(x['estimated_monthly'].replace('UGX ', '').replace(',', '')))
        
        reply = f"💰 **Mortgage Analysis - UGX {property_price:,.0f}**\n\n"
        reply += "Here are financing options from major Ugandan banks:\n\n"
        
        for i, option in enumerate(results[:3], 1):
            reply += f"**{i}. {option['bank']}**\n"
            reply += f"• Rate: {option['interest_rate']}\n"
            reply += f"• Term: {option['max_term']}\n"
            reply += f"• Down payment: {option['min_down_payment']}\n"
            reply += f"• Monthly payment: {option['estimated_monthly']}\n"
            reply += f"• Total interest: {option['total_interest']}\n\n"
        
        reply += "💡 **Tips to qualify for a mortgage:**\n"
        reply += "✅ Save at least 15-20% for down payment\n"
        reply += "✅ Maintain a good credit history\n"
        reply += "✅ Have steady employment (2+ years)\n"
        reply += "✅ Keep debt-to-income ratio below 40%\n\n"
        
        reply += "Would you like to see properties within your budget after down payment?"
        
        # Calculate affordable property range
        remaining_budget = property_price * 0.8  # Assuming 20% down
        affordable_range = f"UGX {remaining_budget * 0.8:,.0f} - {remaining_budget * 1.2:,.0f}"
        
        return {
            'success': True,
            'reply': reply,
            'mortgage_options': results,
            'affordable_range': affordable_range,
            'suggestions': ['Find affordable properties', 'Compare banks', 'Calculate different price'],
            'quick_replies': ['Show properties', 'Compare banks', 'Payment calculator'],
            'agent_used': self.name
        }
    
    def _mortgage_guide(self) -> Dict[str, Any]:
        """Provide general mortgage guidance"""
        reply = """🏦 **Your Guide to Property Mortgages in Uganda**

**📊 Current Bank Rates (2025):**
• Equity Bank: 16.5% (Best rate)
• Centenary Bank: 17.0%
• Stanbic Bank: 18.0%
• Absa Bank: 18.5%
• DFCU Bank: 19.0%

**💰 How Much Can You Afford?**
Use the 28/36 rule:
• Housing costs ≤ 28% of gross income
• Total debt ≤ 36% of gross income

**📝 Mortgage Requirements:**
1. 15-20% down payment
2. 2+ years employment history
3. Good credit score
4. Property valuation report
5. Legal due diligence

**💡 Pro Tips:**
• Get pre-approved before house hunting
• Compare rates from at least 3 banks
• Consider longer terms for lower payments
• Negotiate the interest rate

**🎯 Ready to calculate?** Tell me the property price and I'll give you exact numbers!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Calculate mortgage', 'Compare banks', 'Check affordability'],
            'quick_replies': ['Calculate now', 'Best rates', 'Requirements'],
            'agent_used': self.name
        }
    
    def _extract_price(self, message: str) -> float:
        """Extract price from message"""
        import re
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:billion|b)',
            r'(\d+(?:\.\d+)?)\s*(?:million|m)',
            r'UGX\s*(\d+(?:\.\d+)?)',
            r'property\s*worth\s*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                num = float(match.group(1))
                if 'billion' in pattern or 'b' in pattern:
                    num *= 1_000_000_000
                elif 'million' in pattern or 'm' in pattern:
                    num *= 1_000_000
                return num
        return None