# chatbot/agents/legal_agent.py
from typing import Dict, Any, Tuple
from .base_agent import BaseAgent

class LegalAgent(BaseAgent):
    """Specialized agent for property legal matters and compliance"""
    
    def __init__(self):
        super().__init__(
            name="Legal Advisor",
            expertise="Property law, documentation, and compliance"
        )
        self.legal_keywords = ['legal', 'lawyer', 'attorney', 'contract', 'agreement', 
                               'title', 'deed', 'ownership', 'dispute', 'court', 
                               'registration', 'land lord', 'tenant rights', 'lease',
                               'compliance', 'permit', 'license', 'tax']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a legal query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.legal_keywords:
            if keyword in message:
                score += 0.2
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide legal guidance"""
        message = context.get('original', '').lower()
        
        # Check for specific legal topics
        if any(word in message for word in ['title', 'deed', 'ownership']):
            return self._title_deed_guide()
        elif any(word in message for word in ['tenant', 'landlord', 'rental', 'lease']):
            return self._tenant_landlord_guide()
        elif any(word in message for word in ['tax', 'stamp duty', 'capital gains']):
            return self._property_tax_guide()
        elif any(word in message for word in ['dispute', 'conflict', 'court']):
            return self._dispute_resolution()
        else:
            return self._general_legal_guide()
    
    def _title_deed_guide(self) -> Dict[str, Any]:
        """Guide on property titles and deeds"""
        reply = """📜 **Property Title & Deed Guide - Uganda**

**Types of Land Tenure:**

1. **Freehold** (Mailo Land)
   • Full ownership rights
   • Can sell, lease, or transfer freely
   • Most expensive but most secure

2. **Leasehold**
   • Own for 49 or 99 years
   • Pay ground rent annually
   • Need landlord consent for transfers

3. **Customary**
   • Traditional ownership
   • Can convert to freehold
   • Common in rural areas

**✅ Due Diligence Checklist:**
• Verify title at Ministry of Lands
• Check for caveats/encumbrances
• Confirm survey plan matches
• Get consent from landlord (leasehold)
• Verify stamp duty payment

**⚠️ Red Flags to Watch:**
• Multiple titles for same land
• Missing survey boundaries
• Unpaid ground rent
• Pending court cases
• Forged signatures

**📝 Required Documents:**
• Certificate of Title
• Sale Agreement
• Land Survey Plan
• Valuation Report
• Tax Clearance Certificate

**💡 Pro Tip:** Always hire a lawyer to conduct due diligence before paying any deposit!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Verify title', 'Find a lawyer', 'Checklist download'],
            'quick_replies': ['Find lawyer', 'Checklist', 'Costs involved'],
            'agent_used': self.name
        }
    
    def _tenant_landlord_guide(self) -> Dict[str, Any]:
        """Guide on tenant and landlord rights"""
        reply = """🏠 **Tenant & Landlord Rights - Uganda**

**For Tenants (Renters):**

✅ **Your Rights:**
• Receive receipt for all payments
• 30 days notice before eviction
• Quiet enjoyment of property
• Essential repairs within 7 days
• Return of security deposit (minus damages)

❌ **Landlord Cannot:**
• Enter without 24hr notice
• Increase rent during lease
• Cut utilities for payment issues
• Discriminate illegally

**For Landlords:**

✅ **Your Rights:**
• Receive rent on time
• Screen potential tenants
• Increase rent with 60 days notice
• Evict for non-payment (with court order)

❌ **Cannot:**
• Discriminate based on race/religion
• Enter without notice
• Withhold services as leverage

**📝 Lease Agreement Must Include:**
• Rent amount & due date
• Security deposit terms
• Maintenance responsibilities
• Termination conditions
• Renewal options

**🚨 Common Disputes & Solutions:**
• Late payment → Written warning → Court
• Property damage → Document with photos
• Unpaid utilities → Clear contract terms
• Deposit disputes → Pre-move inspection photos

**Need help?** I can connect you with a property lawyer!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Find lawyer', 'Lease template', 'Rights explained'],
            'quick_replies': ['Tenant rights', 'Landlord rights', 'Get lawyer'],
            'agent_used': self.name
        }
    
    def _property_tax_guide(self) -> Dict[str, Any]:
        """Guide on property taxes"""
        reply = """💰 **Property Taxes in Uganda**

**🏠 Property Transfer Tax (Stamp Duty):**
• Rate: 1% of property value
• Paid by: Buyer
• When: Within 30 days of transfer

**📈 Capital Gains Tax:**
• Rate: 30% on profit
• Applies to: Selling investment property
• Exemption: Primary residence

**🏢 Rental Income Tax:**
• Rate: Progressive (0-30%)
• Deductible: Repairs, insurance, management
• Filing: Annually by June 30

**🌍 Local Service Tax:**
• Amount: UGX 100,000 - 500,000/year
• Paid to: Local council
• Based on: Property value/use

**✅ Tax-Saving Tips:**
• Keep all renovation receipts
• Claim mortgage interest deduction
• Depreciate rental property (2% annually)
• Consider holding property 3+ years
• Register for rental tax grace period

**⚠️ Penalties:**
• Late filing: 5% per month
• Underpayment: 30% surcharge
• Tax evasion: Criminal charges

**Need tax advice?** Consult a tax professional for your specific situation."""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Calculate tax', 'Find accountant', 'Tax exemptions'],
            'quick_replies': ['Calculate stamp duty', 'Tax consultant', 'Payment deadline'],
            'agent_used': self.name
        }
    
    def _dispute_resolution(self) -> Dict[str, Any]:
        """Guide on resolving property disputes"""
        reply = """⚖️ **Property Dispute Resolution**

**Common Property Disputes:**
1. Boundary disagreements
2. Title ownership conflicts
3. Landlord-tenant issues
4. Inheritance disputes
5. Contract breaches

**📋 Resolution Options:**

**1. Negotiation** (Free)
• Best for minor issues
• Keep written records
• Try mediation first

**2. Mediation** (UGX 200k-500k)
• Neutral third party
• Non-binding agreement
• Faster than court (2-4 weeks)

**3. Arbitration** (UGX 500k-2M)
• Binding decision
• Private and confidential
• Faster than court (1-3 months)

**4. Court** (UGX 2M-10M+)
• Last resort
• Takes 1-3 years
• Need lawyer representation

**📝 Evidence to Gather:**
• Title deed
• Sale agreement
• Payment receipts
• Photos/videos
• Witness statements
• Correspondence

**⚡ Urgent Actions:**
• File caveat immediately
• Get court injunction
• Preserve evidence
• Notify all parties

**🏛️ Where to File:**
• Small claims: UGX 10M limit
• Magistrate court: UGX 50M limit
• High court: Above UGX 50M

**Need legal representation?** I can connect you with property lawyers!"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Find lawyer', 'Mediation services', 'File caveat'],
            'quick_replies': ['Find lawyer', 'Mediation', 'File complaint'],
            'agent_used': self.name
        }
    
    def _general_legal_guide(self) -> Dict[str, Any]:
        """General legal guidance"""
        reply = """⚖️ **Property Legal Guide - Uganda**

**I can help you with:**

📜 **Titles & Deeds**
• Understanding land tenure types
• Due diligence checklist
• Title verification process

🏠 **Tenant/Landlord Rights**
• Lease agreement terms
• Eviction procedures
• Security deposit rules

💰 **Property Taxes**
• Stamp duty calculation
• Capital gains tax
• Rental income tax

⚡ **Dispute Resolution**
• Mediation vs court
• Filing a caveat
• Finding legal help

**📞 Emergency Legal Resources:**
• Uganda Law Society: 0312-262-886
• Legal Aid Project: 0414-341-516
• Chief Magistrates Court: 0414-233-779

**What specific legal question can I help with?**"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Title guide', 'Tenant rights', 'Tax guide', 'Dispute help'],
            'quick_replies': ['Titles', 'Tenant rights', 'Taxes', 'Disputes'],
            'agent_used': self.name
        }