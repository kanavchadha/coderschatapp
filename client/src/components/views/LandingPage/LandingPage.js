import React from 'react'
import { FaCode } from "react-icons/fa";

function LandingPage() {

    return (
        <React.Fragment>
        <div className="app">
            <img src="https://thumbs.dreamstime.com/b/guy-working-computer-freelancer-makes-web-project-vector-ilustration-guy-working-computer-102494207.jpg" alt="code" height="280px" />
            {/* <FaCode style={{ fontSize: '4rem' }} /><br /> */}
            <span style={{ fontSize: '2rem' }}>Let's Start Coding!</span>
        </div>
        
        </React.Fragment>
    )
}

export default LandingPage
