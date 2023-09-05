import React from "react"
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Products from "./Products";


function MainPage() {
    return (
        <>
        <Container>
            <Row>
                <Col>
                    <Products/>
                </Col>
            </Row>
        </Container>
        </>
    );
}

export default MainPage;