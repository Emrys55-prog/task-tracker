# task-tracker
CS50x Final Project - Task Tracker Web App

# STRIDE
### Project Video URL: (https://youtu.be/EMxHcXMARdI)
### Location: Home, Nairobi, Kenya

--------------
--------------
PROJECT OVERVIEW
-----------------
-----------------
STRIDE == is a modern, high-performance web application designed to streamline personal task management and optimize productivity. Built with a robust Python Flask backend and a fluid, responsive JavaScript frontend, Stride allows users to seamlessly organize, track, and update daily actions in real-time.


---------------
----------------
KEY FEATURES
---------------
---------------

1.  INSTANT VISUAL FEEEDBACK :Checkboxes and task status toggles render instantly without forcing a complete webpage or database reload cycle.

2. STREAMLINED DELETION ACTIONS: Eliminates disruptive native browser confirmation alerts for direct, rapid task purging.
   
3. ANIMATED COMPLETION SETUP : Features a custom CSS/HTML hardware-accelerated trigger system that glides a "Ta-daaaa!" SpongeBob across the view window upon task termination.

4. COMPEREHENSIVE DASHBOARD METRICS : A dynamic statistical analytics panel that instantly updates task completion percentages, critical pending flags, and totals automatically.

5. PERSISTENT THEME SWAPPING ENGINE : Local-storage backed Light/Dark mode configuration toggles that maintain theme continuity between session contexts.

--------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------

 PROJECT ARCHITECTURE

stride/
├── app.py                 # Core Flask application, route routers, and controller actions.
├── requirements.txt       # Frozen application package distribution requirements.
├── static/
│   ├── style.css 
│   │       # Custom UI design layout sheets, media rules, and keyframe definitions.
│   ├──  script.js 
│   │       # Interactivity engine handling DOM adjustments and Fetch requests.
│   └── images/
│       └── spongebob_rainbow.png# Local graphic asset for task termination cues.
└── templates/
    ├── layout.html        # Persistent core structural HTML layout shell.
    ├── index.html         # Main dashboard interface view housing statistical metrics.
    ├── login.html         # Secure registration and application gatekeeping layouts.
    └── register.html      # New user workspace creation workspace layout.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


--------------------------------------
-------------------------------------
TECHNICAL COMPONENT EXPLANATIONS :
------------------------------------
-----------------------------------


1. app.py
---------------------
   
The primary application control script. Written in Python utilizing Flask, it establishes server routing boundaries for CRUD behaviors. It manages structural tasks securely via custom endpoints (e.g., `/tasks/<id>/toggle`, `/tasks/<id>/delete`) and serves data directly via dynamic engine outputs


2. script.js
-------------------

The front-end interactive system. Rather than executing standard synchronous submit bindings, it intercepts document triggers to optimize state handling. 

   `triggerTaskTerminatedAnimation()`  : Programmatically creates an isolated floating container layer with precise timing              rules, appending animations directly to the viewport layer.
   `deleteResource()`                  : An asynchronous layout management implementation. It initiates an out-of-band POST             request using JavaScript's native `fetch()` API to alert the Flask framework. Simultaneously, it applies                    explicit CSS scale and opacity property transitions, gracefully dropping elements from the DOM tree with a                  buffered `setTimeout` frame cycle to avoid thread blocking.
   `updateStrideBar()`                  : Dynamically parses rows inside the active DOM fragment array, calculating                     priority indicators and updating numerical targets across analytics panels.

3. style.css
------------------

Contains core presentation logic. 
Built using CSS Flexbox rules to achieve robust layout continuity during viewport container resizing adjustments. 
Includes vendor-prefixed properties (`-webkit-background-clip`) alongside target standards to ensure uniform display capabilities across standard browser variations.


---------------------------------------------
------------------------------------------
Local Installation & Setup
----------------------------------------------
-----------------------------------------

1. **Clone the project repository workspace:**
   ```bash
   git clone https://github.com
   cd stride
   ```

2. **Establish and configure a clean virtual runtime environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows execution environments, use: venv\Scripts\activate
   ```

3. **Install standard project requirements securely:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize and trigger the Flask hosting engine locally:**
   ```bash
   flask run
   ```
   Open your preferred browser display framework and navigate securely to: `http://127.0.0`

