import React, { createContext, useContext, useState } from 'react';

interface StickyNotesContextType {
  isOpen: boolean;
  openNotes: () => void;
  closeNotes: () => void;
  toggleNotes: () => void;
}

const StickyNotesContext = createContext<StickyNotesContextType>({
  isOpen: false,
  openNotes: () => {},
  closeNotes: () => {},
  toggleNotes: () => {},
});

export const StickyNotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const openNotes = () => setIsOpen(true);
  const closeNotes = () => setIsOpen(false);
  const toggleNotes = () => setIsOpen(prev => !prev);

  return (
    <StickyNotesContext.Provider value={{ isOpen, openNotes, closeNotes, toggleNotes }}>
      {children}
    </StickyNotesContext.Provider>
  );
};

export const useStickyNotes = () => useContext(StickyNotesContext);
