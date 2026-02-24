import { useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import AboutMe from '../components/sections/AboutMe';
import Experience from '../components/sections/Experience';
import Education from '../components/sections/Education';
import Projects from '../components/sections/Projects';
import Skills from '../components/sections/Skills';
import Contact from '../components/sections/Contact';

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Skills />
        <Experience />
        <Projects />
        <Education />
        <AboutMe />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
