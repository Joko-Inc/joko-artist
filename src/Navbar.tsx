import React, { useState } from 'react';

import { Link } from 'react-router';

export function Navbar() {
    return (
        <nav>
            <div /* Section for profile picture and artist name */>
                <p> Filler Artist </p>
            </div>

            <div /* Clickable sections of menu + Joko logo at bottom */>
                <ul>
                    <li><img /* Symbol here*/ /> Dashboard</li>
                    <li><img /* Symbol here*/ /> Calendar</li>
                    <li><img /* Symbol here*/ /> Create</li>
                    <li><img /* Symbol here*/ /> Analytics</li>
                    <li><img /* Symbol here*/ /> Monetization</li>
                </ul>
                <div>
                    <img /* Joko Logo Here *//>
                </div>
            </div>
        </nav>
    )
}