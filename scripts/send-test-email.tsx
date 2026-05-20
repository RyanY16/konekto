import * as React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import WelcomeEmail from "../emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

const html = await render(<WelcomeEmail displayName="Ryan" username="ryan" />);

const { data, error } = await resend.emails.send({
  from: "Konekto <hello@joinkonek.to>",
  to: "ryanyuen16@gmail.com",
  subject: "Welcome to Konekto — your campus, connected ✦",
  html,
});

if (error) {
  console.error("Failed:", error);
} else {
  console.log("Sent!", data?.id);
}
