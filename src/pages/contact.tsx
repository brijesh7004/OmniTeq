import React from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-cyan-400 mb-4">Contact OmniTeq</h1>
      <p className="text-gray-300 mb-6">We’re ready to collaborate. Fill out the form or reach us directly.</p>
      <form className="grid gap-4 max-w-xl">
        <input className="p-2 rounded bg-gray-800 text-white" placeholder="Your Name" />
        <input className="p-2 rounded bg-gray-800 text-white" placeholder="Your Email" />
        <textarea className="p-2 rounded bg-gray-800 text-white" rows={5} placeholder="Your Message" />
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white">Send Message</button>
      </form>
    </div>
  );
}
