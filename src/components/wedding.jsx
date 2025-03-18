import { useState } from "react";
import { SlActionUndo } from "react-icons/sl";
import { SlActionRedo } from "react-icons/sl";
import { FaDownload } from "react-icons/fa6";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";
import floral from "../assets/floral.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IoImageOutline } from "react-icons/io5";
import { IoColorPaletteOutline } from "react-icons/io5";

const WeddingInvitation = () => {
  const [fontSize, setFontSize] = useState("12.1");
  const [selectedElement, setSelectedElement] = useState(null);
  const [textStyle, setTextStyle] = useState({
    fontFamily: "Cinzel",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#5b4418",
  });
  const availableFonts = [
    { name: "Cinzel", label: "Cinzel" },
    { name: "Great Vibes", label: "Great Vibes" },
    { name: "Arial", label: "Arial" },
    // Add more fonts as needed
  ];
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(floral);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  const backgroundOptions = [{ name: "Floral", image: floral }];

  const handleFocus = (e) => {
    const element = e.target;
    setSelectedElement(element);

    // Get the computed style
    const computedStyle = window.getComputedStyle(element);

    // Get the actual color from the element's style if it exists, otherwise from computed style
    const elementColor = element.style.color || computedStyle.color;
    const rgb = elementColor.match(/\d+/g);
    const hex = rgb
      ? "#" +
        rgb
          .map((x) => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      : "#5b4418";

    setTextStyle({
      fontFamily: computedStyle.fontFamily.replace(/['"]/g, ""),
      fontWeight: element.style.fontWeight || computedStyle.fontWeight,
      fontStyle: element.style.fontStyle || computedStyle.fontStyle,
      textDecoration:
        element.style.textDecoration || computedStyle.textDecoration,
      textAlign: element.style.textAlign || computedStyle.textAlign,
      color: element.style.color || hex,
    });
    setFontSize(computedStyle.fontSize.replace("px", ""));
  };

  const handleToolbarClick = (e) => {
    e.stopPropagation(); // Prevent toolbar clicks from closing color picker
  };

  const addToHistory = (element, property, oldValue, newValue) => {
    const newHistoryItem = {
      element,
      property,
      oldValue,
      newValue,
    };

    const newHistory = history.slice(0, currentIndex + 1);
    setHistory([...newHistory, newHistoryItem]);
    setCurrentIndex(currentIndex + 1);
  };

  const handleInputChange = (e) => {
    const element = e.target;
    const oldValue = element.defaultValue;
    const newValue = e.target.value;

    if (oldValue !== newValue) {
      addToHistory(element, "value", oldValue, newValue);
      element.defaultValue = newValue;
      // Update preview after input change
      updatePreview();
    }
  };

  const handleStyleChange = (element, property, oldValue, newValue) => {
    if (!element) return;

    // Apply the style directly to the element
    element.style[property] = newValue;

    // Update the textStyle state
    setTextStyle((prev) => ({
      ...prev,
      [property]: newValue,
    }));

    // Add to history
    addToHistory(element, property, oldValue, newValue);

    // Update preview
    updatePreview();
  };

  const undo = () => {
    if (currentIndex >= 0) {
      const historyItem = history[currentIndex];
      if (historyItem.element) {
        if (historyItem.property === "value") {
          historyItem.element.value = historyItem.oldValue;
          historyItem.element.defaultValue = historyItem.oldValue;
        } else {
          historyItem.element.style[historyItem.property] =
            historyItem.oldValue;
          setTextStyle((prev) => ({
            ...prev,
            [historyItem.property]: historyItem.oldValue,
          }));
        }
      }
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      const historyItem = history[currentIndex + 1];
      if (historyItem.element) {
        if (historyItem.property === "value") {
          historyItem.element.value = historyItem.newValue;
          historyItem.element.defaultValue = historyItem.newValue;
        } else {
          historyItem.element.style[historyItem.property] =
            historyItem.newValue;
          setTextStyle((prev) => ({
            ...prev,
            [historyItem.property]: historyItem.newValue,
          }));
        }
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const downloadAsImage = (format) => {
    setIsLoading(true);
    const invitationElement = document.querySelector(
      ".max-w-md.mx-auto.bg-white"
    );

    // Create a clone of the invitation element
    const clone = invitationElement.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-9999px"; // Hide the clone
    clone.style.width = `${invitationElement.offsetWidth}px`;
    clone.style.height = `${invitationElement.offsetHeight}px`;
    document.body.appendChild(clone);

    // Convert inputs and textareas to divs
    const elements = clone.querySelectorAll("input, textarea");
    elements.forEach((element) => {
      const div = document.createElement("div");
      const styles = window.getComputedStyle(element);

      div.style.cssText = styles.cssText;
      div.style.position = "absolute";
      div.style.left = `${element.offsetLeft}px`;
      div.style.top = `${element.offsetTop}px`;
      div.style.width = `${element.offsetWidth}px`;
      div.style.height = `${element.offsetHeight}px`;
      div.style.color = styles.color;
      div.style.fontFamily = styles.fontFamily;
      div.style.fontSize = styles.fontSize;
      div.style.fontWeight = styles.fontWeight;
      div.style.textAlign = styles.textAlign;
      div.style.transform = styles.transform;
      div.style.background = "transparent";
      div.textContent = element.value || element.textContent;

      element.parentNode.replaceChild(div, element);
    });

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: true,
    })
      .then((canvas) => {
        try {
          // Generate preview
          const previewImage = canvas.toDataURL("image/png");
          setPreviewUrl(previewImage);

          if (format === "pdf") {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save("wedding-invitation.pdf");
          } else {
            const link = document.createElement("a");
            link.download = `wedding-invitation.${format}`;
            link.href = canvas.toDataURL(`image/${format}`);
            link.click();
          }
        } catch (error) {
          console.error("Download error:", error);
        }

        document.body.removeChild(clone);
        setIsLoading(false);
        setShowDownloadMenu(false);
      })
      .catch((error) => {
        console.error("Canvas error:", error);
        document.body.removeChild(clone);
        setIsLoading(false);
      });
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedBackground(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.toolbar-container')) {
      setShowBgMenu(false);
      setShowFontDropdown(false);
    }
  };

  const TextToolbar = () => (
    <div
      className="bg-white w-[540px] shadow-lg rounded-lg p-2 flex items-center gap-2 mb-4 toolbar-container"
      onClick={handleToolbarClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="relative">
  <button
    className="border rounded px-2 py-1 w-32 bg-white flex justify-between items-center"
    onClick={(e) => {
      e.stopPropagation();
      setShowFontDropdown(!showFontDropdown);
    }}
  >
    <span style={{ fontFamily: textStyle.fontFamily }}>
      {textStyle.fontFamily}
    </span>
    <span>▼</span>
  </button>

  {showFontDropdown && (
    <div className="absolute top-full left-0 w-48 mt-1 bg-white border rounded shadow-lg z-[1000] max-h-60 overflow-y-auto">
      {availableFonts.map((font) => (
        <button
          key={font.name}
          className={`w-full px-2 py-1 text-left hover:bg-gray-100 ${
            textStyle.fontFamily === font.name ? "bg-gray-50" : ""
          }`}
          style={{ fontFamily: font.name }}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedElement) {
              const oldValue = selectedElement.style.fontFamily;
              const newValue = font.name;
              selectedElement.style.fontFamily = newValue;
              setTextStyle((prev) => ({ ...prev, fontFamily: newValue }));
              handleStyleChange(selectedElement, "fontFamily", oldValue, newValue);
            }
            setShowFontDropdown(false);
          }}
        >
          {font.label}
        </button>
      ))}
    </div>
  )}
</div>

      <div className="flex items-center gap-1 border-l pl-2">
        <button
          className="px-1"
          onClick={() => {
            if (selectedElement) {
              const oldSize = selectedElement.style.fontSize;
              const newSize = `${parseFloat(fontSize) - 1}px`;
              handleStyleChange(selectedElement, "fontSize", oldSize, newSize);
              selectedElement.style.fontSize = newSize;
              setFontSize((parseFloat(fontSize) - 1).toString());
            }
          }}
        >
          -
        </button>
        <input
          type="text"
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            if (selectedElement) {
              selectedElement.style.fontSize = `${e.target.value}px`;
            }
          }}
          className="w-12 text-center border rounded"
        />
        <button
          className="px-1"
          onClick={() => {
            if (selectedElement) {
              const newSize = `${parseFloat(fontSize) + 1}px`;
              handleStyleChange(
                selectedElement,
                "fontSize",
                selectedElement.style.fontSize,
                newSize
              );
              selectedElement.style.fontSize = newSize;
              setFontSize((parseFloat(fontSize) + 1).toString());
            }
          }}
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-2 border-l pl-2">
        <div className="relative group">
          <label className="p-1 hover:bg-gray-100 rounded cursor-pointer flex items-center gap-1">
            <IoColorPaletteOutline className="text-lg" />
            <input
              type="color"
              value={textStyle.color}
              onChange={(e) => {
                if (selectedElement) {
                  const oldColor =
                    selectedElement.style.color || textStyle.color;
                  const newColor = e.target.value;
                  selectedElement.style.color = newColor; // Apply color only to selected element
                  setTextStyle((prev) => ({
                    ...prev,
                    color: newColor,
                  }));
                  addToHistory(selectedElement, "color", oldColor, newColor);
                  updatePreview();
                }
              }}
              className="opacity-0 absolute w-8 h-8 cursor-pointer"
              onClick={(e) => e.stopPropagation()} // Prevent color picker from closing
            />
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: textStyle.color }}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 border-l pl-2">
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.fontWeight === "bold" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldWeight = selectedElement.style.fontWeight;
              const newWeight =
                textStyle.fontWeight === "bold" ? "normal" : "bold";
              handleStyleChange(
                selectedElement,
                "fontWeight",
                oldWeight,
                newWeight
              );
              selectedElement.style.fontWeight = newWeight;
              setTextStyle({ ...textStyle, fontWeight: newWeight });
            }
          }}
        >
          <FaBold />
        </button>
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.fontStyle === "italic" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldStyle = selectedElement.style.fontStyle;
              const newStyle = oldStyle === "italic" ? "normal" : "italic";
              handleStyleChange(
                selectedElement,
                "fontStyle",
                oldStyle,
                newStyle
              );
              selectedElement.style.fontStyle = newStyle;
              setTextStyle({ ...textStyle, fontStyle: newStyle });
            }
          }}
        >
          <FaItalic />
        </button>
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.textDecoration === "underline" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldDecoration = selectedElement.style.textDecoration;
              const newDecoration =
                oldDecoration === "underline" ? "none" : "underline";
              handleStyleChange(
                selectedElement,
                "textDecoration",
                oldDecoration,
                newDecoration
              );
              selectedElement.style.textDecoration = newDecoration;
              setTextStyle({ ...textStyle, textDecoration: newDecoration });
            }
          }}
        >
          <FaUnderline />
        </button>
      </div>

      <div className="flex items-center gap-2 border-l pl-2">
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.textAlign === "left" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldAlign = selectedElement.style.textAlign;
              const newAlign = "left";
              handleStyleChange(
                selectedElement,
                "textAlign",
                oldAlign,
                newAlign
              );
              selectedElement.style.textAlign = newAlign;
              setTextStyle({ ...textStyle, textAlign: newAlign });
            }
          }}
        >
          <FaAlignLeft />
        </button>
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.textAlign === "center" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldAlign = selectedElement.style.textAlign;
              const newAlign = "center";
              handleStyleChange(
                selectedElement,
                "textAlign",
                oldAlign,
                newAlign
              );
              selectedElement.style.textAlign = newAlign;
              setTextStyle({ ...textStyle, textAlign: newAlign });
            }
          }}
        >
          <FaAlignCenter />
        </button>
        <button
          className={`p-1 hover:bg-gray-100 rounded ${
            textStyle.textAlign === "right" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            if (selectedElement) {
              const oldAlign = selectedElement.style.textAlign;
              const newAlign = "right";
              handleStyleChange(
                selectedElement,
                "textAlign",
                oldAlign,
                newAlign
              );
              selectedElement.style.textAlign = newAlign;
              setTextStyle({ ...textStyle, textAlign: newAlign });
            }
          }}
        >
          <FaAlignRight />
        </button>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-700">Generating download...</p>
      </div>
    </div>
  );

  // Add new function to update preview
  const updatePreview = () => {
    const invitationElement = document.querySelector(
      ".max-w-md.mx-auto.bg-white"
    );
    if (!invitationElement) return;

    // Create a clone of the invitation element
    const clone = invitationElement.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.width = `${invitationElement.offsetWidth}px`;
    clone.style.height = `${invitationElement.offsetHeight}px`;
    document.body.appendChild(clone);

    // Convert inputs and textareas to divs
    const elements = clone.querySelectorAll("input, textarea");
    elements.forEach((element) => {
      const div = document.createElement("div");
      const styles = window.getComputedStyle(element);

      div.style.cssText = styles.cssText;
      div.style.position = "absolute";
      div.style.left = `${element.offsetLeft}px`;
      div.style.top = `${element.offsetTop}px`;
      div.style.width = `${element.offsetWidth}px`;
      div.style.height = `${element.offsetHeight}px`;
      div.style.color = styles.color;
      div.style.fontFamily = styles.fontFamily;
      div.style.fontSize = styles.fontSize;
      div.style.fontWeight = styles.fontWeight;
      div.style.textAlign = styles.textAlign;
      div.style.transform = styles.transform;
      div.style.background = "transparent";
      div.textContent = element.value || element.textContent;

      element.parentNode.replaceChild(div, element);
    });

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    }).then((canvas) => {
      const previewImage = canvas.toDataURL("image/png");
      setPreviewUrl(previewImage);
      document.body.removeChild(clone);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100" onClick={handleClickOutside}>
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center p-2 space-x-4">
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 hover:bg-gray-100/35 text-white text-xl rounded relative group"
                onClick={undo}
                disabled={currentIndex < 0}
              >
                <SlActionUndo />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Undo
                </span>
              </button>
              <button
                className="px-4 py-2 hover:bg-gray-100/35 text-white text-xl rounded relative group"
                onClick={redo}
                disabled={currentIndex >= history.length - 1}
              >
                <SlActionRedo />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Redo
                </span>
              </button>
              <label className="px-4 py-2 hover:bg-gray-100/35 text-white text-xl rounded relative group cursor-pointer">
                <IoImageOutline />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Upload Background
                </span>
              </label>
            </div>
          </div>

          <div className="mr-6 relative">
            <button
              className="px-4 py-1.5 hover:bg-white text-black bg-gray-100/75 text-xl rounded"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <FaDownload />
            </button>

            {showDownloadMenu && (
              <div className="fixed inset-0 flex" style={{ zIndex: 1000 }}>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-25"
                  onClick={() => setShowDownloadMenu(false)}
                ></div>

                {/* Preview and Download Panel */}
                <div className="relative flex bg-white w-[800px] mx-auto mt-3 rounded-lg shadow-xl overflow-hidden">
                  {/* Preview Section */}
                  <div className="flex-1 p-4 border-r">
                    <h3 className="text-lg font-semibold mb-2">Preview</h3>
                    <div className="overflow-auto">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-auto"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                          <p className="text-gray-500">
                            Preview will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Download Options */}
                  <div className="w-64 p-4">
                    <h3 className="text-lg font-semibold mb-4">Download As</h3>
                    <div className="space-y-2">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => downloadAsImage("pdf")}
                      >
                        PDF Document
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => downloadAsImage("png")}
                      >
                        PNG Image
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => downloadAsImage("jpeg")}
                      >
                        JPG Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 bg-gray-50">
        <div className="max-w-md mx-auto mb-4">
          <TextToolbar />
        </div>

        <div className="max-w-md mx-auto bg-white shadow-lg p-8 min-h-[600px] relative">
          <img
            src={selectedBackground}
            alt="Wedding Invitation Background"
            className="w-full h-full object-cover"
          />
          <textarea
            defaultValue="PLEASE JOIN US AT OUR WEDDING"
            className="absolute font-cinzel w-36 top-36 mt-3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md text-sm uppercase resize-none overflow-hidden break-words whitespace-pre-wrap p-1"
            style={{ color: textStyle.color, height: "auto" }}
            rows={2}
            onFocus={handleFocus}
            onChange={handleInputChange}
          />

          <input
            type="text"
            defaultValue="Jay Patel"
            className="absolute w-64 h-20 font-bold top-48 mt-7 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md text-4xl font-great-vibes"
            style={{ color: textStyle.color }}
            onFocus={handleFocus}
            onChange={handleInputChange}
          />

          <div
            className="absolute font-bold w-48 top-64 mt-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-great-vibes text-center"
            style={{ color: textStyle.color }}
          >
            &
          </div>

          <input
            type="text"
            defaultValue="Rani Patel"
            className="absolute w-64 h-20 font-bold top-72 mt-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md text-4xl font-great-vibes"
            style={{ color: textStyle.color }}
            onFocus={handleFocus}
            onChange={handleInputChange}
          />

          <div className="absolute flex items-center mt-10 gap-3 top-80 left-1/2 transform -translate-x-1/2 text-center">
            <input
              type="text"
              defaultValue="Saturday"
              className="text-sm font-cinzel uppercase w-20 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
              style={{ color: textStyle.color }}
              onFocus={handleFocus}
              onChange={handleInputChange}
            />
            <div className="flex flex-col items-center">
              <input
                type="text"
                defaultValue="24"
                className="text-4xl font-cinzel w-12 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
                style={{ color: textStyle.color }}
                onFocus={handleFocus}
                onChange={handleInputChange}
              />
              <input
                type="text"
                defaultValue="May"
                className="text-2xl -mt-3 font-cinzel w-16 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
                style={{ color: textStyle.color }}
                onFocus={handleFocus}
                onChange={handleInputChange}
              />
            </div>
            <input
              type="text"
              defaultValue="8:00 AM"
              className="text-sm font-cinzel w-20 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
              style={{ color: textStyle.color }}
              onFocus={handleFocus}
              onChange={handleInputChange}
            />
          </div>

          <input
            type="text"
            defaultValue="123 Anywhere St., Any City"
            className="absolute text-[14px] font-cinzel w-64 mt-8 top-[420px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
            style={{ color: textStyle.color }}
            onFocus={handleFocus}
            onChange={handleInputChange}
          />

          <input
            type="text"
            defaultValue="RSVP: 123-456-7890"
            className="absolute text-[14px] font-cinzel w-64 mt-8 top-[440px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-transparent focus:outline-none focus:bg-white/50 focus:border focus:border-blue-400 focus:rounded-md p-1"
            style={{ color: textStyle.color }}
            onFocus={handleFocus}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default WeddingInvitation;
