export interface WhatsAppTemplate {
  id: string;
  title: string;
  subject: string;
  message: string;
  recipient: 'Client' | 'Technician' | 'Admin';
  status: string;  // This will match ticket statuses
  isActive: boolean;
  variables?: string[]; // For dynamic placeholders like {Customer Name}
}

export const TICKET_STATUSES = {
  in_queue: "Generated",
  assigned: "Ticket Assigned",
  ticket_accepted: "Ticket Accepted",
  pickup: "Pickup Schedule",
  product_received: "Product Received",
  in_progress: "In Progress",
  client_approval: "Client Approval",
  delivery_scheduled: "Delivery Scheduled",
  delivered: "Delivered",
  done: "Done",
  invoice_sent: "Invoice Sent",
  payment_received: "Payment Received",
  complete: "Complete",
  hold: "On Hold"
} as const;

export const DEFAULT_TEMPLATES = [
  {
    id: "1",
    title: "Query Received",
    subject: "📞 Your Query Received!",
    message: `Dear {Customer Name},

Thank you for contacting the MP2TECH Support team. We have received your query. One of our technicians will get in touch with you within a few minutes.

Thank You,
MP2TECH Support team.`,
    recipient: "Client",
    status: "in_queue",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "2",
    title: "Technician Started",
    subject: "🛠️ Technician On the Job: Your Ticket in Progress!",
    message: `Dear Client,
We wanted to inform you that the Technician has begun working on your Ticket. He will do his best to complete the job as quickly and efficiently as possible. Please let us know if you need anything or have any concerns.

Thank You,
MP2TECH Support team.`,
    recipient: "Client",
    status: "in_progress",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "3",
    title: "Pickup Scheduled",
    subject: "🚚 Pickup Scheduled: Technician En Route for Your Device! 🖥️",
    message: `Dear Client,
We'd like to inform you that your laptop/desktop pickup has been scheduled, and a technician has been dispatched. Our team is committed to providing you with the best service possible and ensuring a smooth resolution for any device issues.

Our technician is en route to your location and will arrive shortly. Kindly ensure that someone is available at the specified address for the pickup.

Thank you for your cooperation. We appreciate your trust in our services.

Best regards,
MP2TECH
+919930568888`,
    recipient: "Client",
    status: "pickup",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "4",
    title: "Product Received",
    subject: "🛠️ Device Assessment Update: We've Received Your Device! 📱",
    message: `Dear Client,
We have received your Device and we are currently assessing the issue. We will keep you updated on the progress of the repair and let you know when it is ready for pickup/Drop. If you have any questions, please don't hesitate to contact us.

Best regards,
MP2TECH
+91 9930568888`,
    recipient: "Client",
    status: "product_received",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "5",
    title: "Estimate Sent",
    subject: "🔍 Review Required: Estimate & Terms for Your Device 📝",
    message: `Dear Client,
We hope you're well. Your device is with us for assessment. Before we proceed with repairs, your approval is needed. Kindly review the attached estimate and confirm your consent.

By approving, you agree to our terms outlined in the estimate. If you have any questions, feel free to ask.

Thank you for choosing MP2TECH.

Best regards,
MP2TECH Support team.`,
    recipient: "Client",
    status: "client_approval",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "6",
    title: "Approval Received",
    subject: "🎉 Approval Confirmed: Your Ticket in Progress! 🛠️",
    message: `Dear Client,
Thank you for approving the estimated cost and timeline for your ticket. We appreciate your trust in our services.

Our team will begin working on your ticket right away and will keep you updated on the progress.

Please do not hesitate to contact us if you have any questions or concerns.

Thank you again for choosing us.

Best regards,
MP2TECH Support team.`,
    recipient: "Client",
    status: "in_progress",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "7",
    title: "Update After Repair",
    subject: "🛠️ Repair Update: Your Laptop Repair Completed Successfully!",
    message: `Hi {Customer Name},
We're excited to provide you with an update on your repair:

Great news! Your laptop has undergone successful repairs for the following issues:
- {Issue 1}
- {Issue 2}
- {Issue 3}

Your device is now working perfectly fine. 💻✅

Currently, it's under observation, and we'll inform you of the exact delivery time after completion of testing.

If you have any further questions or need assistance, feel free to reach out to us.

Thank you for choosing MP2TECH! We're here to keep your tech running smoothly. 😊🛠️

Best regards,
MP2TECH Support Team
+919930568888`,
    recipient: "Client",
    status: "done",
    isActive: true,
    variables: ["{Customer Name}", "{Issue 1}", "{Issue 2}", "{Issue 3}"]
  },
  {
    id: "8",
    title: "Delivery Scheduled",
    subject: "🛠️ Your Device Repaired & Ready for Delivery! 📦",
    message: `Dear Client,
We are pleased to inform you that your device has been repaired and is now ready for delivery. Our team will get in touch with you shortly to confirm the delivery time.

If you have any questions or concerns, please do not hesitate to contact us. We are always happy to assist you in any way we can.

Thank you for your business and for choosing our services. We hope to serve you again in the future.

Best regards,
MP2TECH Support Team
+91 9930-56-8888`,
    recipient: "Client",
    status: "delivery_scheduled",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "9",
    title: "Delivered",
    subject: "📦 Confirmation: Your Device Successfully Delivered! 🚀",
    message: `Dear Client,
We want to confirm that your device has been successfully delivered. If you have any questions or need assistance, feel free to reach out. We are always happy to assist you in any way we can.

Thank you for your business and for choosing our services. We hope to serve you again in the future.

Best regards,
MP2TECH Support Team
+91 9930-56-8888`,
    recipient: "Client",
    status: "delivered",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "10",
    title: "Invoice Sent",
    subject: "🛠️ Work Completed: Invoice Coming Soon! 📑",
    message: `Dear Client,
We hope you are doing well. Our technician has successfully completed the work assigned to them as per the agreed-upon terms and conditions. We are confident that you are satisfied with the quality of service provided.

As per our agreement, we would like to inform you that an invoice will be generated for the services provided. The invoice will be sent to you shortly via Whatsapp or email. Please review the invoice carefully and let us know if you have any questions or concerns.

We appreciate your business and look forward to working with you again in the future.

Thank you for choosing our services.

Best regards,
MP2TECH Support Team.`,
    recipient: "Client",
    status: "invoice_sent",
    isActive: true,
    variables: ["{Customer Name}"]
  },
  {
    id: "11",
    title: "On Hold",
    subject: "🚫 Repair Status Update: Your Device On Hold 🛑",
    message: `Dear Client,
We regret to inform you that the repair of your device has been put on hold. Our team is working diligently to resolve the issue and resume the repair process as soon as possible.

We apologize for any inconvenience this may cause and we will keep you updated on the status of your laptop. Please let us know if you have any questions or concerns.

Thank you for your patience and understanding.

Best regards,
MP2TECH
+91 9930568888`,
    recipient: "Client",
    status: "hold",
    isActive: true,
    variables: ["{Customer Name}"]
  }
] as const; 