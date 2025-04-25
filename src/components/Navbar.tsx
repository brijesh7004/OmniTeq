import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 text-white">
      <h1 className="text-2xl font-bold text-cyan-400">OmniTeq</h1>
      <div className="space-x-4">
        <a href="#products">Products</a>
        <a href="#services">Services</a>
        <a href="#projects">Projects</a>
        <a href="#contact">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Contact</Button>
        </a>
      </div>
    </nav>
  );
}
