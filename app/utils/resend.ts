import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (
  to: string | string[],
  subject: string,
  msg: string,
  from = "Instaanalyzer <noreply@instaanalyser.com>"
) => {
  try {
    const data = await resend.emails.send({
      from: from,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: msg,
    });
    console.log("mail send");
  } catch (error) {
    console.error(error);
  }
};
