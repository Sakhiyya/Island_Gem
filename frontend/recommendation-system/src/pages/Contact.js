import React, { useState } from "react";
import Header from "../components/Header";
import { FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";
import "./Contact.css";

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <Header />
      <div className="contact-page">

        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Send us a message and we'll get back to you within 24 hours.</p>
        </div>

        <div className="contact-grid">

          {/* LEFT: INFO */}
          <div className="contact-info">
            <h3>Get in Touch</h3>

            <div className="contact-detail">
              <FaMapMarkerAlt className="contact-icon" />
              <div>
                <p className="detail-label">Address</p>
                <p>Port Louis, Mauritius</p>
              </div>
            </div>

            <div className="contact-detail">
              <FaEnvelope className="contact-icon" />
              <div>
                <p className="detail-label">Email</p>
                <a href="mailto:hello@islandgems.mu">hello@islandgems.mu</a>
              </div>
            </div>

            <div className="contact-detail">
              <FaPhone className="contact-icon" />
              <div>
                <p className="detail-label">Phone</p>
                <a href="tel:+23058515683">+230 5851 5683</a>
              </div>
            </div>

            <div className="contact-hours">
              <p className="detail-label">Office Hours</p>
              <p>Monday – Friday: 9:00 AM – 5:00 PM</p>
              <p>Saturday: 9:00 AM – 12:00 PM</p>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="How can we help?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                rows={6}
                required
              />
            </div>

            {status === "success" && (
              <p className="form-success">
                Your message has been sent! We'll get back to you within 24 hours.
              </p>
            )}
            {status === "error" && (
              <p className="form-error">
                Something went wrong. Please try again or email us directly.
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>

        </div>
      </div>
    </>
  );
}

export default Contact;
