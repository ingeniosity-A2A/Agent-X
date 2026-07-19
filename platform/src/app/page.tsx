'use client'

import { useState, useCallback } from "react";
import "./assembly.css";

const furnitureItems = [
  {
    id: 1,
    name: "Black Friday Sale 1",
    price: 0,
    img: "https://img.freepik.com/free-psd/black-friday-big-sale-social-media-post-design-template_47987-17588.jpg",
  },
  {
    id: 2,
    name: "Black Friday Sale 2",
    price: 0,
    img: "https://img.freepik.com/free-psd/black-friday-discount-sale-social-media-post-design-template_47987-17462.jpg",
  },
  {
    id: 3,
    name: "Black Friday Sale 3",
    price: 0,
    img: "https://img.freepik.com/free-psd/black-friday-discount-sale-social-media-post-design-template_47987-24479.jpg",
  },
  {
    id: 4,
    name: "Black Friday Sale 4",
    price: 0,
    img: "https://img.freepik.com/free-psd/black-friday-mega-sale-social-media-post-design-template_47987-24437.jpg",
  },
  {
    id: 5,
    name: "Black Friday Sale 5",
    price: 0,
    img: "https://img.freepik.com/free-psd/black-friday-mega-sale-social-media-post-design-template_47987-24477.jpg",
  },
];

function FurnitureCarousel() {
  const [current, setCurrent] = useState(0);
  const total = furnitureItems.length;

  const getNext = useCallback((i: number) => (i + 1) % total, [total]);
  const getPrev = useCallback((i: number) => (i - 1 + total) % total, [total]);

  const getSlot = (i: number) => {
    if (i === current) return "rc-center";
    if (i === getPrev(current)) return "rc-left";
    if (i === getNext(current)) return "rc-right";
    return "rc-hidden";
  };

  return (
    <div className="rc-wrap">
      <div className="rc-stage">
        {furnitureItems.map((f, i) => (
          <div
            key={f.id}
            className={`rc-card ${getSlot(i)}`}
            onClick={() => setCurrent(i)}
          >
            <img src={f.img} alt={f.name} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Camera3D({ rotating }: { rotating: boolean }) {
  return (
    <div className={`camera${rotating ? " camera--rotating" : ""}`} role="img" aria-label="White 3D camera">
      <div className="camera__shadow"></div>
      <div className="camera__front"></div>
      <div className="camera__contents">
        <div className="camera__red-light"></div>
        <div className="camera__lens-shadow"></div>
        <div className="camera__lens-back"></div>
        <div className="camera__lens-ring">
          <div className="camera__lens-ring-glare1"></div>
          <div className="camera__lens-ring-glare2"></div>
          <div className="camera__lens-ring-glare3"></div>
        </div>
        <div className="camera__lens-inner">
          <div className="camera__lens-inner-glare1"></div>
          <div className="camera__lens-inner-glare2"></div>
          <div className="camera__lens-eye-shadow"></div>
          <div className="camera__lens-glare"></div>
          <div className="camera__lens-eye">
            <div className="camera__lens-eye-ring"></div>
            <div className="camera__lens-eye-inner-glare"></div>
            <div className="camera__lens-eye-center">
              <div className="camera__lens-eye-center-glare"></div>
            </div>
            <div className="camera__lens-eye-glass-color"></div>
            <div className="camera__lens-eye-glare"></div>
            <div className="camera__lens-eye-glass"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#f7ad32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

export default function Home() {
  const [modelInput, setModelInput] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [sent, setSent] = useState(false);
  const [workshopInput, setWorkshopInput] = useState("");

  const grandTotal = furnitureItems.reduce((s, i) => s + i.price, 0);
  const quoteCount = furnitureItems.filter((i) => i.price > 0).length;
  const hasMultipleQuotes = quoteCount > 1;

  const handleShare = () => {
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    if (email) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setShowEmailInput(false);
        setEmail("");
      }, 3000);
    }
  };

  const handleWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workshopInput.trim()) {
      setWorkshopInput("");
    }
  };

  return (
    <div className="assembly-page-bg">
      <div className="assembly-wrapper">

        {/* ── HEADER ── */}
        <header className="assembly-header">
          <div className="assembly-header-row">
            <div className="assembly-header-left">
              <span className="assembly-header-logo-text">Assembly Tech</span>
            </div>
            <div className="assembly-header-center">
              <h1 className="assembly-page-title">Home</h1>
            </div>
            <div className="assembly-header-right">
              <div className="assembly-profile assembly-profile-initials">
                <span>AT</span>
                <span className="assembly-profile-dot" />
              </div>
            </div>
          </div>
        </header>

        <section className="assembly-section">

          {/* ── HERO CARD ── */}
          <div className="assembly-hero-card">
            <div className="assembly-hero-gold-panel">
              <textarea
                className="assembly-hero-textarea"
                placeholder="Type  Model information or Upload a image"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
              />
              <span className="assembly-hero-model-label">MODEL: REV.IKE 1.0</span>
            </div>
            <div className="assembly-hero-camera-box">
              <Camera3D rotating={hasMultipleQuotes} />
            </div>
          </div>

          {/* ── FURNITURE ASSEMBLY — 3D Reflection Carousel ── */}
          <div className="assembly-row-header">
            <h3 className="assembly-segment-title">Furniture Assembly</h3>
          </div>

          <FurnitureCarousel />

          {/* ── TOTAL SECTION ── */}
          <div className="assembly-row-header assembly-margin-vertical">
            <h3 className="assembly-segment-title">Total</h3>
          </div>

          {/* Featured Total — Neumorphic raised rectangle */}
          <div className="assembly-featured-product">
            <div className="featured-top-row">
              <div className="content-img">
                <FolderIcon />
              </div>
              <div className="product-detail">
                <h4 className="product-name">Grand Total</h4>
                <p className="price">${grandTotal}.00</p>
              </div>
              <div className="share-inline">
                {showEmailInput && !sent && (
                  <input
                    className="assembly-email-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                )}
                <button className="assembly-share-btn-sm" onClick={handleShare}>
                  {sent ? (
                    <span className="assembly-share-sent">✓ Sent!</span>
                  ) : showEmailInput ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      Send
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Attachment — Workshop search bar */}
            <div className="assembly-workshop">
              <form onSubmit={handleWorkshopSubmit}>
                <input
                  type="text"
                  placeholder="BOOK WITH AI..."
                  value={workshopInput}
                  onChange={(e) => setWorkshopInput(e.target.value)}
                />
                <button type="submit">Connect A2A</button>
              </form>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
