import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import "./Calendar.css";

const Calendar = ({ onLogout }) => {
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch events from the backend
useEffect(() => {
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/events", {
        credentials: "include", // Ensure session data is sent
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data); // Update events with backend data
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  fetchEvents();
}, []); // Empty dependency array ensures this runs only once

  // Show form for adding a new event
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);setEventTitle(""); // Clear the title for the new event
    setStartTime(""); // Clear the start time
    setEndTime(""); // Clear the end time
    setSelectedEvent(null); // Clear the selected event
    setShowEventForm(true); // Open the form for a new event
  };

  // Add a new event
  const handleAddEvent = async () => {
    if (eventTitle && startTime && endTime) {
      const updatedEvent = {
        title: eventTitle,
        start: `${selectedDate}T${startTime}`,
        end: `${selectedDate}T${endTime}`,
        type: selectedEvent?.type || "general",
        completed: selectedEvent?.completed || false, // Default to "general" if not set
      };
  
      try {
        let response;
        if (selectedEvent && selectedEvent._id) {
          console.log("Updating event:", updatedEvent);
          response = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updatedEvent),
          });
  
          if (response.ok) {
            const updatedEventFromBackend = await response.json();
            console.log("Updated event:", updatedEventFromBackend);
            setEvents(
              events.map((event) =>
                event._id === updatedEventFromBackend._id ? updatedEventFromBackend : event
              )
            );
          } else {
            console.error("Failed to update event:", response.statusText);
          }
        } else {
          console.log("Creating new event:", updatedEvent);
          response = await fetch("http://localhost:5000/api/events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updatedEvent),
          });
  
          if (response.ok) {
            const savedEvent = await response.json();
            console.log("Created event:", savedEvent);
            setEvents([...events, savedEvent]);
          } else {
            console.error("Failed to create event:", response.statusText);
          }
        }
  
        setShowEventForm(false);
        setEventTitle("");
        setStartTime("");
        setEndTime("");
        setSelectedEvent(null);
      } catch (error) {
        console.error("Error saving event:", error);
      }
    } else {
      alert("Please fill out all fields.");
    }
  };
  
  

  // Show event details in a modal
  const handleEventClick = (info) => {
    const clickedEvent = events.find(
      (event) => event.title === info.event.title
    );
    setSelectedEvent(clickedEvent);
    setModalOpen(true);
  };

  // Delete an event
  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/events/${selectedEvent._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
  
      if (response.ok) {
        setEvents(events.filter((event) => event._id !== selectedEvent._id));
        setModalOpen(false);
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };
  

  // Reschedule an event 
  const handleRescheduleEvent = () => {
    setEventTitle(selectedEvent.title); // Pre-fill the title
    setSelectedDate(selectedEvent.start.split("T")[0]); // Pre-fill the date
    setStartTime(selectedEvent.start.split("T")[1]); // Pre-fill the start time
    setEndTime(selectedEvent.end.split("T")[1]); // Pre-fill the end time
    setSelectedEvent((prev) => ({
      ...prev,
      type: selectedEvent.type || "general", // Preserve type, default to "general" if undefined
      completed: selectedEvent.completed, // Preserve completion state
    }));
    setModalOpen(false); // Close the modal
    setShowEventForm(true); // Show the form for editing
  };

  const [showCongrats, setShowCongrats] = useState(false); 
  const handleToggleCompletion = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/events/${selectedEvent._id}/completed`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
  
      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map(event => 
          event._id === updatedEvent._id ? updatedEvent : event
        ));
        setSelectedEvent(updatedEvent); // Update the modal

      // Show congratulation message
      if (updatedEvent.type === "academic" && updatedEvent.completed) {
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 5000); // Hide after 3 seconds
      }
      } else {
        alert("Failed to update completion status");
      }
    } catch (error) {
      console.error("Error toggling completion status:", error);
    }
  };
  
  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/logout", {
        method: "GET",
        credentials: "include",
      });
  
      if (response.ok) {
        alert("You have been logged out successfully!");
        window.location.reload(); // Reloads the page or redirects to login
      } else {
        alert("Failed to log out. Please try again.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  return (
    <div className="calendar-container">
      {/* Logout Button */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    {/* Milestone Summary */}
    <div className="milestone-summary">
      <h3>Milestone Summary</h3>
      <p>Completed: {events.filter(event => event.type === "academic" && event.completed).length}</p>
      <p>Pending: {events.filter(event => event.type === "academic" && !event.completed).length}</p>
    </div>
    {/* Congratulations Message */}
    {showCongrats && (
      <div className="congratulation-message">
        🎉 Congratulations! You've just completed an academic milestone! Great progress! 🎉
      </div>
    )}
      {/* FullCalendar */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events.map(event => ({
          ...event,
          color: event.type === "academic" ? (event.completed ? "green" : "blue") : "gray", // Color based on type and status
          extendedProps: { completed: event.completed }, // For additional logic
        }))}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      {/* Add Event Form */}
      {showEventForm && (
  <div className="event-form">
    <h3>Add Event</h3>
    <label>
      Title:
      <input
        type="text"
        value={eventTitle}
        onChange={(e) => setEventTitle(e.target.value)}
      />
    </label>
    <label>
      Date:
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
    </label>
    <label>
      Start Time:
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
    </label>
    <label>
      End Time:
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
    </label>
    <label>
      Type:
      <select
        value={selectedEvent?.type || "general"}
        onChange={(e) =>
          setSelectedEvent((prev) => ({ ...prev, type: e.target.value }))
        }
      >
        <option value="general">General</option>
        <option value="academic">Academic Milestone</option>
      </select>
    </label>
    <button onClick={handleAddEvent}>Add Event</button>
    <button onClick={() => setShowEventForm(false)}>Cancel</button>
  </div>
)}

      {/* Event Details Modal */}
      {modalOpen && selectedEvent && (
        <div className="event-modal">
          <h3>Event Details</h3>
          <p><strong>Title:</strong> {selectedEvent.title}</p>
          <p><strong>Start:</strong> {selectedEvent.start}</p>
          <p><strong>End:</strong> {selectedEvent.end}</p>
          <div className="modal-buttons">
          {selectedEvent.type === "academic" && (
    <div>
      <input
        type="checkbox"
        checked={selectedEvent.completed}
        onChange={handleToggleCompletion}
      />
      Mark as Completed
    </div>
  )}
            <button onClick={handleRescheduleEvent}>Reschedule</button>
            <button onClick={handleDeleteEvent}>Delete</button>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;



