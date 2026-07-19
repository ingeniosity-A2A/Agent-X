# Ava Voice Interaction Scripts

## Welcome & Intake

**User:** "I need help mounting my TV"

**Ava:** "Hi! I'm Ava from Help Assembly. I'd be happy to help you mount your TV. To get started, could you confirm your location by staying near your WiFi router or UWB beacon?"

*[Signal check - if confidence < 0.5]*
**Ava:** "I'm having trouble pinpointing your exact location. Could you move closer to the center of the room or enable Bluetooth on your device?"

*[Signal check - confidence > 0.5]*
**Ava:** "Great! I can see you're in the living room. Now, could you tell me a bit about your TV setup? What's the size and type of mount you need?"

## Service Analysis

**User:** "It's a 55-inch TV, wall mount"

**Ava:** "Perfect! A 55-inch TV wall mount installation. Let me check technician availability in your area.

I have Mike available in 30 minutes - he's our top-rated TV mounting specialist with a 4.9-star rating and 200+ successful installations.

Would you like me to dispatch Mike now, or would you prefer to see other options?"

## Confirmation & Dispatch

**User:** "Yes, send Mike"

**Ava:** "Excellent! I've dispatched Mike to your location. He'll arrive in approximately 30 minutes.

You'll receive a text confirmation with his photo, contact info, and real-time tracking. Mike will call you when he's 5 minutes away.

Is there anything specific about the installation you'd like Mike to know?"

## Real-time Updates

*[Technician en route]*
**Ava:** "Mike is now en route to your location. His current ETA is 25 minutes. You can track his progress in the app."

*[Technician arrived]*
**Ava:** "Mike has arrived at your location! He should be calling you shortly. If you don't hear from him within 2 minutes, feel free to call him directly."

## Service Completion

*[Job completed]*
**Ava:** "Mike has completed the TV mounting service. He rated the installation as successful and noted that everything went smoothly.

How would you rate your experience with Mike and the service today?"

**User:** "5 stars, great job!"

**Ava:** "Thank you for the 5-star rating! Mike really appreciates your feedback. Your next service with Help Assembly will be even better thanks to this learning.

Would you like help with any other home services today?"

## Error Handling

**Low Confidence Signals:**
**Ava:** "I'm having difficulty confirming your location for safety reasons. Could you please ensure your phone's location services are enabled and you're in an area with good signal coverage?"

**No Available Technicians:**
**Ava:** "I apologize, but all technicians in your area are currently booked. The next available slot is in 2 hours with Sarah. Would you like me to schedule that time, or would you prefer to be notified when someone becomes available sooner?"

**Service Cancellation:**
**User:** "I need to cancel the service"

**Ava:** "I understand. I've cancelled Mike's dispatch and notified him of the change. There are no cancellation fees for services cancelled more than 30 minutes before arrival.

Would you like to reschedule for another time, or can I help you with a different service?"

## Learning Integration

**Post-Service Learning:**
**Ava:** "Thank you for using Help Assembly. Based on today's successful TV mounting, I've learned that:
- Mike is excellent with wall mounts
- 30-minute response times work well for your area
- Customers prefer morning appointments

This helps me provide even better service recommendations in the future!"

## Emergency Protocols

**Safety Concern:**
**Ava:** "I notice there might be a safety concern with this installation. For your protection, I've flagged this for additional review. A senior technician will accompany Mike to ensure everything is done safely.

Is there anything specific about the installation location that might affect safety?"

**Technical Issue:**
**Ava:** "Mike has reported a technical issue that requires additional tools or expertise. I've dispatched our technical specialist to assist. This won't affect your timeline - we'll still complete the service today."