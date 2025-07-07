// File: App.jsx (Tambola Full Code)

import React, { useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoCallSharp } from "react-icons/io5";
import { MdMarkEmailUnread } from "react-icons/md";
import "./App.css";

const TOTAL_NUMBERS = 90;
const digitWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

function numberToWords(num) {
  const belowTwenty = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (num < 20) return belowTwenty[num];
  const tenPart = Math.floor(num / 10);
  const unitPart = num % 10;
  return `${tens[tenPart]}${unitPart ? "-" + belowTwenty[unitPart] : ""}`;
}


//ADD THIS FUNCTION: Fixes your error "speak is not defined"
function speak(text, voiceType, rate) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.voice = window.speechSynthesis.getVoices().find(v =>
    v.name.toLowerCase().includes(voiceType)
  );
  window.speechSynthesis.speak(u);
}


function speakNumber(num, voiceType, rate) {
  if (!window.speechSynthesis) return;

  let speechText = "";

  if (num < 10) {
    speechText = `Single number ${digitWords[num]}`;
  } else {
    const digits = String(num).split("").map(d => digitWords[parseInt(d)]).join(" ");
    const fullName = numberToWords(num);
    speechText = `${digits}, ${fullName}`;
  }

  const utter = new SpeechSynthesisUtterance(speechText);
  utter.rate = rate;
  utter.voice = window.speechSynthesis
    .getVoices()
    .find(v => v.name.toLowerCase().includes(voiceType));

  window.speechSynthesis.speak(utter);
}


function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [ticketCount, setTicketCount] = useState(40);
  const [ticketPrice, setTicketPrice] = useState(20);
  const [tickets, setTickets] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [autoplay, setAutoplay] = useState(false);
  const intervalRef = useRef(null);
  const [playerName, setPlayerName] = useState("");
  const [viewTicketNumbers, setViewTicketNumbers] = useState([]);
  const [adminEditInput, setAdminEditInput] = useState("");
  const [durationHours, setDurationHours] = useState(1); // default 1 hour
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminPassword, setAdminPassword] = useState("54ningthou@#$!"); // default password
  const [adminEntered, setAdminEntered] = useState(false);    // whether correct password entered
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");     // temp input field
  const [gameMessage, setGameMessage] = useState('');
  const [selected, setSelected] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [wins, setWins] = useState({
    earlyFive: [],
    lines: {},
    fullHouse: [],
    fullSheet: [],
    halfSheet: []
  });
  const [maxWinners, setMaxWinners] = useState({
    earlyFive: 1,
    firstLine: 1,
    secondLine: 1,
    thirdLine: 1,
    fullHouse: 1,
    fullSheet: 1,
    halfSheet: 1
  });
  const [voiceRate, setVoiceRate] = useState(1);
  const [voiceType, setVoiceType] = useState("male");
   
  // Preload voices on first load
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);


  useEffect(() => {
    setTickets(generateTickets(ticketCount));
  }, [ticketCount]);

  //countdown timer
   useEffect(() => {
  if (!timerEndTime) return;

  const interval = setInterval(() => {
    const now = new Date();
    const diff = timerEndTime - now;

    if (diff <= 0) {
      setTimeLeft("Time's up!");
      clearInterval(interval);
    } else {
      const hours = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
      const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [timerEndTime]);

function TicketView({ ticket, ticketNumber }) {
  return (
    <div className="ticket-view">
      <h5>🎟 Ticket #{ticketNumber} – {ticket.bookedBy}</h5>
      <table>
        <tbody>
          {ticket.data.map((row, ri) => (
            <tr key={ri}>
              {row.map((num, ci) => (
                <td key={ci} className={num && calledNumbers.includes(num) ? "marked" : ""}>
                  {num || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


  useEffect(() => {
    if (autoplay) {
      intervalRef.current = setInterval(callNext, 5500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoplay, calledNumbers]);

  
  useEffect(() => {
    checkPrizes();
  }, [calledNumbers]);

  const remaining = [...Array(90)].map((_, i) => i + 1).filter(n => !calledNumbers.includes(n));
  const soldTickets = tickets.filter(t => t.status === "SOLD");

  const callNext = () => {
    if (!remaining.length) return;
    const n = remaining[Math.floor(Math.random() * remaining.length)];
    setCalledNumbers(prev => [...prev, n]);
    speakNumber(n, voiceType, voiceRate);
  };


  const whatsapp = "https://wa.me/916009454169";
 
   const handleBooking = () => {
  if (!playerName.trim() || selected.length === 0) return;

  const updated = [...tickets];
  selected.forEach(id => {
    updated[id].status = "SOLD";
    updated[id].bookedBy = playerName;
  });

  setTickets(updated);

  const serials = selected.map(id => `#${id + 1}`).join(", ");
  const total = ticketPrice * selected.length;
  const message = `Hi, I booked Tambola tickets.\nName: ${playerName}\nTickets: ${serials}\nTotal: ₹${total}`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/916009454169?text=${encodedMessage}`; // Replace with your number
  
  
  window.open(whatsappUrl, "_blank");

  setPlayerName("");
  setSelected([]);
  setShowBooking(false);
};



   const checkPrizes = () => {
   const newWins = { ...wins };
   const lineWins = {};

    soldTickets.forEach((ticket, index) => {
    const flat = ticket.data.flat().filter(n => n !== 0);
    const marked = flat.filter(n => calledNumbers.includes(n));
    const ticketLabel = `${index + 1} – ${ticket.bookedBy || "?"}`;

    // Early Five
    if (
      marked.length >= 5 &&
      newWins.earlyFive.length < maxWinners.earlyFive &&
      !newWins.earlyFive.includes(ticketLabel)
    ) {
      newWins.earlyFive.push(ticketLabel);
      speak(`Early Five won by ticket ${ticketLabel}`, voiceType, voiceRate);
    }

     // Lines
    ticket.data.forEach((row, rowIdx) => {
      const rowKey = `${index}_${rowIdx}`;
      const isComplete = row.filter(n => n !== 0).every(n => calledNumbers.includes(n));
      const prizeName = ["firstLine", "secondLine", "thirdLine"][rowIdx];
      const alreadyWon = Object.values(newWins.lines).filter(v => v.prize === prizeName).length;

      if (
        isComplete &&
        !newWins.lines[rowKey] &&
        alreadyWon < maxWinners[prizeName]
      ) {
        lineWins[rowKey] = { prize: prizeName, ticket: ticketLabel };
        speak(`${prizeName.replace("Line", " Line")} won by ticket ${ticketLabel}`, voiceType, voiceRate);
      }
    });

    // Full House
    if (
      flat.length === marked.length &&
      newWins.fullHouse.length < maxWinners.fullHouse &&
      !newWins.fullHouse.includes(ticketLabel)
    ) {
      newWins.fullHouse.push(ticketLabel);
      speak(`Full House won by ticket ${ticketLabel}`, voiceType, voiceRate);
    }
  });

  // Sheet Bonus
  const byPlayer = {};
  soldTickets.forEach((t, i) => {
    const name = t.bookedBy;
    if (!name) return;
    if (!byPlayer[name]) byPlayer[name] = [];
    byPlayer[name].push({ ...t, id: i });
  });

 for (const name in byPlayer) {
  const list = byPlayer[name];
  const counts = list.map(t => t.data.flat().filter(n => calledNumbers.includes(n)).length);
  const ticketIndexes = list.map(t => t.id + 1); // serial numbers

  if (
    list.length === 6 &&
    counts.every(c => c > 0) &&
    newWins.fullSheet.length < maxWinners.fullSheet &&
    !newWins.fullSheet.some(w => w.name === name)
  ) {
    newWins.fullSheet.push({ name, ticketIndexes });
    speak(`Full Sheet Bonus won by tickets ${name}`, voiceType, voiceRate);
  }

  if (
    list.length === 3 &&
    counts.every(c => c > 0) &&
    newWins.halfSheet.length < maxWinners.halfSheet &&
    !newWins.halfSheet.some(w => w.name === name)
  ) {
    newWins.halfSheet.push({ name, ticketIndexes });
    speak(`Half Sheet Bonus won by tickets ${name}`, voiceType, voiceRate);
  }
}


  newWins.lines = { ...wins.lines, ...lineWins };
    setWins(newWins);

  newWins.lines = { ...wins.lines, ...lineWins };
     setWins(newWins);

//Auto game over when all prizes are claimed
const allPrizesGiven =
  newWins.earlyFive.length >= maxWinners.earlyFive &&
  newWins.fullHouse.length >= maxWinners.fullHouse &&
  newWins.fullSheet.length >= maxWinners.fullSheet &&
  newWins.halfSheet.length >= maxWinners.halfSheet &&
  Object.values(newWins.lines).filter(p => p.prize === "firstLine").length >= maxWinners.firstLine &&
  Object.values(newWins.lines).filter(p => p.prize === "secondLine").length >= maxWinners.secondLine &&
  Object.values(newWins.lines).filter(p => p.prize === "thirdLine").length >= maxWinners.thirdLine;

if (allPrizesGiven && autoplay) {
  setGameMessage("Game Over. Thank you!");
    setTimeout(() => setGameMessage(""), 8600000);

  speak("Game over. Thank you for playing. See you next time!", voiceType, voiceRate);
  setAutoplay(false);
}
};

  return (
    <div className="app">
        <div className="img">
        <img src="/images/Home.jpg" alt="" />

        </div>
<div className="header">
      
   <button onClick={() => {
      if (adminEntered) {
        setAdminEntered(false);
        setAdminMode(false);
      } else {
         setShowAdminLogin(true);
      }
     }}>
    {adminEntered ? "Exit" : "Login"}
   </button>

{showAdminLogin && (
  <div className="admin-login-popup">
    <h3>Enter Admin Password</h3>
    <input
      type="password"
      value={passwordInput}
      onChange={(e) => setPasswordInput(e.target.value)}
      placeholder="Password"
    />
    <button onClick={() => {
      if (passwordInput === adminPassword) {
        setAdminEntered(true);
        setAdminMode(true);
        setShowAdminLogin(false);
        setPasswordInput("");
      } else {
        alert("Incorrect password");
      }
    }}>Login</button>
    <button onClick={() => {
      setShowAdminLogin(false);
      setPasswordInput("");
    }}>Cancel</button>
  </div>
)}

   <button onClick={() => setShowBooking(true)}>Booking</button>
        
  <div>
   <a href={whatsapp}
    target= "_blank" rel="noopener noreferrer">
     <button>Whatsapp</button> 
    </a>
   </div>

</div>

             
     {timeLeft && (
     <div className="admin-timer">⏰ {timeLeft}</div>
    )} 

    {gameMessage && (
  <div className="game-banner">
    {gameMessage}
  </div>
  )}




      {adminMode && (
        <div className="admin-controls">
          <h3>Admin Controls</h3>
          <label>Total Tickets <input type="number" value={ticketCount} onChange={e => setTicketCount(+e.target.value)} /></label>
          <label>Ticket Price ₹<input type="number" value={ticketPrice} onChange={e => setTicketPrice(+e.target.value)} /></label>
          <label>Voice Rate <input type="number" value={voiceRate} onChange={e => setVoiceRate(+e.target.value)} /></label>
          <label>Voice <select value={voiceType} onChange={e => setVoiceType(e.target.value)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select></label>
             <div className="winner-settings">
            {Object.keys(maxWinners).map(k => (
              <label key={k}>{k}: <input type="number" value={maxWinners[k]} onChange={e => setMaxWinners(p => ({ ...p, [k]: +e.target.value }))} /></label>
            ))}

      <button
      onClick={() => {
      if (!autoplay) {
      const startText = "Game Live!";
      setGameMessage(startText);               // show banner immediately
      speak("Ready 1, 2, 3 and game start!", voiceType, voiceRate);
      setAutoplay(true);                       // start game now (no delay)
    } else {
      setAutoplay(false);
      setGameMessage("⏸ Game Paused");
      speak("Game paused", voiceType, voiceRate);
      setTimeout(() => setGameMessage(""), 70000); // clear paused message after 3s
    }
  }}
>
  {autoplay ? "⏸ Pause" : "▶️ Auto Play"}
  
 </button>
   <button onClick={callNext}>Call Number</button>
</div>
  

 <div className="auto">
  <label>
    ⏱ Duration (hours):{" "}
    <input
      type="number"
      min="1"
      max="24"
      value={durationHours}
      onChange={(e) => setDurationHours(+e.target.value)}
      style={{ padding: '6px', borderRadius: '6px', width: '199px' }}
    />
  </label>
  <button onClick={() => setTimerEndTime(new Date(Date.now() + durationHours * 60 * 60 * 1000))}>
    ▶️ Start Timer
  </button>
  {timeLeft && <div className="admin-timer">{timeLeft}</div>}
</div>

{adminMode && (
  <div className="admin-ticket-panel">
    <h3>Admin Ticket Manager</h3>

    {/*Live Tracking Summary */}
    <div className="ticket-summary">
      <p>✅ SOLD: <strong>{tickets.filter(t => t.status === "SOLD").length}</strong></p>
      <p>❌ UNSOLD: <strong>{tickets.filter(t => t.status === "UNSOLD").length}</strong></p>
      <p>📊 TOTAL: <strong>{tickets.length}</strong></p>
    </div>

    {/* 🔍 Search by Ticket Number */}
    <input 
      type="text"
      placeholder="🔍 Search ticket number"
      style={{ width: "222px", margin: "10px 0", padding: "8px" }}
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />

    {/* 🛠 Editable Table */}
    <div className="table-container">
      <table className="admin-ticket-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Status</th>
            <th>Booked By</th>
            <th>Change</th>
          </tr>
        </thead>
         <tbody>
            {tickets
  .map((t, i) => ({ ...t, index: i }))
  .filter(t => t.status !== "DELETED")
  .filter(t => String(t.index + 1).includes(searchTerm))
  .map((t, i) => (

      <tr key={t.index}>
  <td>{t.index + 1}</td>
  <td>
    <span
      style={{
        color: t.status === "SOLD" ? "green" : "gray",
        fontWeight: "bold"
      }}
    >
      {t.status}
    </span>
  </td>
  <td>
    <input
      type="text"
      value={t.bookedBy || ""}
      placeholder="Name"
      onChange={e => {
        const updated = [...tickets];
        updated[t.index].bookedBy = e.target.value;
        setTickets(updated);
      }}
    />
  </td>
  <td>
    <select
      value={t.status}
      onChange={e => {
        const updated = [...tickets];
        updated[t.index].status = e.target.value;
        setTickets(updated);
      }}
    >
      <option value="UNSOLD">UNSOLD</option>
      <option value="SOLD">SOLD</option>
    </select>
  </td>
  <td>
    {t.status === "UNSOLD" && (
  <button
    onClick={() => {
      if (window.confirm(`Delete UNSOLD ticket #${t.index + 1}?`)) {
        const updated = [...tickets];
        updated[t.index].status = "DELETED";
        updated[t.index].bookedBy = null;
        setTickets(updated);
      }
    }}
    style={{
      background: "red",
      color: "white",
      border: "none",
      padding: "5px 10px",
      borderRadius: "4px",
      cursor: "pointer"
    }}
  >
    Delete
  </button>
)}

  </td>
</tr>

))}
</tbody>

      </table>
    </div>
  </div>
)}
</div>
)}
      <div className="number-grid">
        {[...Array(90)].map((_, i) => (
          <div key={i} className={`number ${calledNumbers.includes(i + 1) ? "called" : "uncalled"} ${calledNumbers.at(-1) === (i + 1) ? "current" : ""}`}>{i + 1}</div>
        ))}
      </div>

<div className="prizes">
  <h3>Prize Winners</h3>
  <ul>
    <li>
      Early Five:
      {wins.earlyFive.length > 0 ? (
        <>
          {wins.earlyFive.map((w, i) => (
            <div className="price" key={i}>
              🎟TNO: {w}
              <button onClick={() => {
                const tno = parseInt(w.split("–")[0]);
                setViewTicketNumbers([tno]);
              }}>VIEW</button>
            </div>
          ))}
        </>
      ) : "—"}
    </li>

    <li>
      Full House:
      {wins.fullHouse.length > 0 ? (
        <>
          {wins.fullHouse.map((w, i) => (
            <div className="price" key={i}>
              🎟TNO: {w}
              <button onClick={() => {
                const tno = parseInt(w.split("–")[0]);
                setViewTicketNumbers([tno]);
              }}>VIEW</button>
            </div>
          ))}
        </>
      ) : "—"}
    </li>

    <li>
      Full Sheet Bonus:
      {wins.fullSheet.length > 0 ? (
        wins.fullSheet.map((w, i) => (
          <div className="price" key={i}>
            {w.ticketIndexes.map(tno => (
              <div key={tno}>🎟TNO:{tno} ({w.name})</div>
            ))}
            <button onClick={() => setViewTicketNumbers(w.ticketIndexes)}>VIEW</button>
          </div>
        ))
      ) : "—"}
    </li>

    <li>
      Half Sheet Bonus:
      {wins.halfSheet.length > 0 ? (
        wins.halfSheet.map((w, i) => (
          <div className="price" key={i}>
            {w.ticketIndexes.map(tno => (
              <div key={tno}>🎟TNO:{tno} ({w.name})</div>
            ))}
            <button onClick={() => setViewTicketNumbers(w.ticketIndexes)}>VIEW</button>
          </div>
        ))
      ) : "—"}
    </li>

    <li>
      First Line:
      {Object.entries(wins.lines).filter(([_, v]) => v.prize === "firstLine").map(([k, v], i) => (
        <div className="price" key={k}>
          🎟TNO: {v.ticket}
          <button onClick={() => {
            const tno = parseInt(v.ticket.split("–")[0]);
            setViewTicketNumbers([tno]);
          }}>VIEW</button>
        </div>
      ))}
    </li>

    <li>
      Second Line:
      {Object.entries(wins.lines).filter(([_, v]) => v.prize === "secondLine").map(([k, v], i) => (
        <div className="price" key={k}>
          🎟TNO: {v.ticket}
          <button onClick={() => {
            const tno = parseInt(v.ticket.split("–")[0]);
            setViewTicketNumbers([tno]);
          }}>VIEW</button>
        </div>
      ))}
    </li>

    <li>
      Third Line:
      {Object.entries(wins.lines).filter(([_, v]) => v.prize === "thirdLine").map(([k, v], i) => (
        <div className="price" key={k}>
          🎟TNO: {v.ticket}
          <button onClick={() => {
            const tno = parseInt(v.ticket.split("–")[0]);
            setViewTicketNumbers([tno]);
          }}>VIEW</button>
        </div>
      ))}
    </li>
  </ul>
</div>

 <input
  type="text"
  placeholder="🔍 Search ticket"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

   {/* 👇 View selected ticket(s) below */}
 {viewTicketNumbers.length > 0 && (
    <div className="view-tickets-section">
      <h4>🎫 Ticket View</h4>
      {viewTicketNumbers.map(tno => {
        const t = tickets[tno - 1];
        return <TicketView key={tno} ticket={t} ticketNumber={tno} />;
      })}
      <button onClick={() => setViewTicketNumbers([])}>Close</button>
    </div>
  )}

<div className="tickets">
  {tickets
    .map((t, i) => ({ ...t, index: i }))
    .filter(t =>
      t.bookedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.index + 1).includes(searchTerm)
    )
    .map(t => (

      <div key={t.index} className={`ticket ${t.status.toLowerCase()}`}>
  <strong>#{t.index + 1}</strong> – 
  {t.status === "SOLD" ? (
    <span style={{ color: "green", fontWeight: "bold" }}>
      SOLD to {t.bookedBy}
    </span>
  ) : (
    <span style={{ color: "red", fontWeight: "bold" }}>UNSOLD</span>
  )}
  <table>
    <tbody>
      {t.data.map((row, ri) => (
        <tr key={ri}>
          {row.map((num, ci) => (
            <td key={ci} className={calledNumbers.includes(num) ? "marked" : ""}>
              {num || ""}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
    ))}
</div> 

 

      {showBooking && (
        <div className="booking">
          <input placeholder="Your name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
          <div className="grid">
            {tickets.map((t, i) => (
              <button key={i} disabled={t.status === "SOLD"} className={selected.includes(i) ? "selected" : ""} onClick={() => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])}>{i + 1}</button>
            ))}
          </div>
          <p>Total: ₹{ticketPrice * selected.length}</p>
          <button onClick={handleBooking}>Book</button>
          <button onClick={() => setShowBooking(false)}>Close</button>
        </div>
      )}

    
 <footer className="contact">
         <h1>Contact Us</h1>
    <div className="all_contact">
           
       <p> <FaLocationDot /> Nambol, Heigrujam Mamang Leikai, Imphat West, Manipur, 795001</p>
            
       <p> <IoCallSharp />6009454169</p>
        
       <p> <MdMarkEmailUnread />ningthourembaningthouremba@gmail.com </p>    
    </div>
 </footer>
    </div>
  );
}


function generateTickets(n) {
  const all = [];
  for (let i = 0; i < n; i++) {
    const t = generateSingleTicket();
    all.push({ data: t, status: "UNSOLD", bookedBy: null });
  }
  return all;
}

function generateSingleTicket() {
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];

  const columns = columnRanges.map(([start, end]) => {
    const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    shuffle(nums);
    return nums.slice(0, 3);
  });

  const ticket = Array.from({ length: 3 }, () => Array(9).fill(0));
  for (let col = 0; col < 9; col++) {
    const nums = columns[col];
    const rows = [0, 1, 2];
    shuffle(rows);
    for (let i = 0; i < nums.length && i < 3; i++) {
      ticket[rows[i]][col] = nums[i];
    }
  }

  for (let row = 0; row < 3; row++) {
    let filled = ticket[row].filter(n => n > 0).length;
    if (filled > 5) {
      const nonZero = ticket[row].map((val, i) => ({ val, i })).filter(x => x.val > 0);
      shuffle(nonZero);
      for (let i = 0; i < filled - 5; i++) {
        ticket[row][nonZero[i].i] = 0;
      }
    }
  }

  return ticket;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}


export default App;
