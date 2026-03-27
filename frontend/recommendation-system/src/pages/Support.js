import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import {
  FaChevronDown, FaChevronUp,
  FaQuestionCircle, FaMapMarkerAlt, FaShieldAlt, FaLifeRing,
} from "react-icons/fa";
import "./Support.css";

const SECTIONS = [
  {
    id: "faq",
    icon: <FaQuestionCircle />,
    title: "Frequently Asked Questions",
    items: [
      {
        q: "What is the best time to visit Mauritius?",
        a: "The best time is from May to December when the weather is cooler and drier. Peak season is June–August with pleasant temperatures around 20–25°C.",
      },
      {
        q: "Do I need a visa to visit Mauritius?",
        a: "Most nationalities can enter Mauritius visa-free for up to 60 days. Check with your local embassy for country-specific requirements.",
      },
      {
        q: "What currency is used in Mauritius?",
        a: "The Mauritian Rupee (MUR) is the official currency. Credit cards are widely accepted at hotels and major restaurants. ATMs are available in most towns.",
      },
      {
        q: "Is it safe to travel to Mauritius?",
        a: "Mauritius is one of the safest countries in Africa. Standard travel precautions apply — avoid isolated areas at night and keep valuables secure.",
      },
      {
        q: "What language is spoken in Mauritius?",
        a: "English and French are official languages. Mauritian Creole is widely spoken in daily life. Most tourist areas are English and French-friendly.",
      },
    ],
  },
  {
    id: "tips",
    icon: <FaMapMarkerAlt />,
    title: "Travel Tips",
    items: [
      {
        q: "How do I get around Mauritius?",
        a: "Renting a car gives the most freedom and is recommended for exploring the island. Buses cover most of the island cheaply. Taxis are available — always agree on the fare before getting in.",
      },
      {
        q: "What should I pack?",
        a: "Lightweight and breathable clothing, reef-safe sunscreen, mosquito repellent, a light jacket for cooler evenings, and a universal power adapter (230V, Type G plug).",
      },
      {
        q: "Is tap water safe to drink?",
        a: "Tap water is generally safe in Mauritius. Bottled water is widely available and recommended if you have a sensitive stomach.",
      },
      {
        q: "Are credit cards accepted everywhere?",
        a: "Cards are accepted at most hotels, restaurants, and tourist spots. Carry some cash (MUR) for local markets, street food, and small vendors.",
      },
      {
        q: "What are the cultural etiquette tips?",
        a: "Dress modestly when visiting temples and mosques — cover shoulders and knees. Remove shoes before entering religious sites. A polite greeting goes a long way with locals.",
      },
    ],
  },
  {
    id: "safety",
    icon: <FaShieldAlt />,
    title: "Safety Information",
    items: [
      {
        q: "Emergency contact numbers",
        a: "Police: 999 | Ambulance: 114 | Fire: 115 | Coast Guard: 112 | Tourist Police Unit: +230 210 3894",
      },
      {
        q: "What to do in case of a medical emergency?",
        a: "The main public hospital is Sir Seewoosagur Ramgoolam National Hospital in Pamplemousses. Call 114 for ambulance services. Several private clinics are available in Port Louis and Grand Baie.",
      },
      {
        q: "How to stay safe at the beach?",
        a: "Always swim within the flagged zones patrolled by lifeguards. Be aware of currents and riptides. Avoid swimming alone in isolated or unflagged areas.",
      },
      {
        q: "Are there any health precautions to take?",
        a: "Ensure your Hepatitis A and Typhoid vaccinations are up to date. Use mosquito repellent, especially during the wet season (November–April), to prevent dengue fever.",
      },
      {
        q: "What to do if you lose your passport?",
        a: "Report the loss to the nearest police station for a police report. Then contact your country's embassy or consulate in Mauritius to arrange emergency travel documents.",
      },
    ],
  },
  {
    id: "help",
    icon: <FaLifeRing />,
    title: "Help Center",
    items: [
      {
        q: "How do I use the Explore page?",
        a: "Go to Explore from the navigation bar. Use the type filters to narrow down by category (beach, hotel, restaurant, etc.). Click 'View Details' on any card to read reviews and visitor insights.",
      },
      {
        q: "How does the recommendation system work?",
        a: "Visit 'Plan Trip' and select your travel type (solo, couple, family), your interests (beaches, food, nature, etc.), and the number of days. The system suggests a personalized day-by-day itinerary based on real visitor reviews.",
      },
      {
        q: "What is the Tourist Hub?",
        a: "The Tourist Hub provides analytics about Mauritius attractions — including top-rated destinations, sentiment trends, most discussed aspects, and visitor patterns — all driven by real review data.",
      },
      {
        q: "Can I save my itinerary?",
        a: "Yes! Once you generate your itinerary on the Plan Trip page, log in to your tourist account and click 'Save Itinerary' to keep it for reference during your trip.",
      },
      {
        q: "How do I contact support?",
        a: "Use the Contact page to send us a message, or email us directly at hello@islandgems.mu. We aim to respond within 24 hours.",
      },
    ],
  },
];

function Support() {
  const [openSection, setOpenSection] = useState(null);
  const [openItem, setOpenItem]       = useState(null);

  const toggleSection = (id)  => setOpenSection(prev => prev === id  ? null : id);
  const toggleItem    = (key) => setOpenItem(prev    => prev === key ? null : key);

  return (
    <>
      <Header />
      <div className="support-page">

        <div className="support-header">
          <h1>Support Center</h1>
          <p>Find answers to common questions and travel tips for your Mauritius adventure.</p>
        </div>

        <div className="support-sections">
          {SECTIONS.map(section => (
            <div key={section.id} className="support-section">

              <button
                className="section-toggle"
                onClick={() => toggleSection(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-title">{section.title}</span>
                {openSection === section.id ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {openSection === section.id && (
                <div className="section-content">
                  {section.items.map((item, i) => {
                    const key = `${section.id}-${i}`;
                    return (
                      <div key={key} className="faq-item">
                        <button
                          className="faq-question"
                          onClick={() => toggleItem(key)}
                        >
                          <span>{item.q}</span>
                          {openItem === key ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {openItem === key && (
                          <div className="faq-answer">{item.a}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}
        </div>

        <div className="support-cta">
          <p>Still have questions?</p>
          <Link to="/contact" className="support-cta-btn">Contact Us</Link>
        </div>

      </div>
    </>
  );
}

export default Support;
