/**
 * POST /api/submit
 * Handles contact form submissions and sends an email via Resend
 */
export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const name = formData.get("name") || "No name provided";
    const email = formData.get("email") || "No email provided";
    const subject = formData.get("subject") || "New Contact Form Submission";
    const message = formData.get("message") || "No message provided";

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contact Form <onboarding@resend.dev>",
        to: ["jeremyteaches76@gmail.com"],
        subject: `Contact Form: ${subject}`,
        html: `
          <h2>New message from your website</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return new Response("Failed to send email", { status: 500 });
    }

    return new Response("Message sent successfully!", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("Form submission error:", err);
    return new Response("Server error", { status: 500 });
  }
}
