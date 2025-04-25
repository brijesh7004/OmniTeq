import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold text-cyan-400">OmniTeq</h1>
        <p className="mt-2 text-lg">Next-Gen Tech, Infinite Possibilities</p>
        <p className="mt-4 max-w-2xl mx-auto text-gray-300">
          Empowering innovation in Embedded Systems, IoT, AI, and Blockchain. We deliver cutting-edge products and tech services for the future.
        </p>
        <div className="mt-6 space-x-4">
          <a href="/files/OmniTeq_Services_Brochure.pdf" target="_blank">
            <Button className="bg-blue-600 hover:bg-blue-700">Download Brochure</Button>
          </a>
          <a href="/files/OmniTeq_PitchDeck.pdf" target="_blank">
            <Button className="bg-green-600 hover:bg-green-700">View Pitch Deck</Button>
          </a>
        </div>
      </section>

      <section className="px-8 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-cyan-300">Products</h2>
            <ul className="mt-4 list-disc list-inside text-gray-200">
              <li>IoT/WiFi School Alarm System</li>
              <li>Smart WiFi Electrical Plug/Box</li>
              <li>Smart WiFi Touch Module Switch</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-cyan-300">Service Offerings</h2>
            <ul className="mt-4 list-disc list-inside text-gray-200">
              <li>PLC Programming</li>
              <li>Embedded Programming</li>
              <li>Data Science (Python)</li>
              <li>Data Analysis (Python)</li>
              <li>GenAI Custom Chatbots</li>
              <li>Blockchain Solutions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-cyan-300">Project-Based Services</h2>
            <ul className="mt-4 list-disc list-inside text-gray-200">
              <li>Custom Project Development</li>
              <li>Tech Resource Outsourcing</li>
              <li>Consulting & Deployment</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="text-center py-12 px-4">
        <h2 className="text-2xl font-bold text-cyan-400">Get in Touch</h2>
        <p className="text-gray-300 mt-2">Ready to work with us or want to learn more?</p>
        <Button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white">Contact Us</Button>
      </section>
    </main>
  );
}
