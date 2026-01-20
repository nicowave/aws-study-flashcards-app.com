import React from 'react';
import { HomeIcon, ArrowRightIcon } from './Icons';

const Breadcrumb = ({ certName, currentPage }) => {
  return (
    <nav className="breadcrumb">
      <a href="https://aws-study-flashcards-app.com" className="breadcrumb-link home">
        <HomeIcon size={16} />
        <span>Study Hub</span>
      </a>
      <ArrowRightIcon size={14} className="breadcrumb-separator" />
      <span className="breadcrumb-current">{certName}</span>
      {currentPage && (
        <>
          <ArrowRightIcon size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{currentPage}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
