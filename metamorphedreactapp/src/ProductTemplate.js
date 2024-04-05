import React, { useEffect, useState } from "react"
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import { useLocation, Link } from 'react-router-dom';
import MultiSelect from 'multiselect-react-dropdown';
import { BoxArrowDown, BoxArrowUp} from 'react-bootstrap-icons';
import Switch from 'react-bootstrap/Switch';

function ProductTemplate() {
    const location = useLocation()
    const products = location.state.products
    const [templateName, setTemplateName] = useState('')
    const [templateSelected, setTemplateSelected] = useState(false)
    const [selectedProductID, setSelectedProductID] = useState('')
    const [selectedTemplateID, setSelectedTemplateID] = useState('')
    const [filteredKeys, setFilteredKeys] = useState(new Set())
    const [saveMessage, setSaveMessage] = useState('')
    const [saveMessageVariant, setSaveMessageVariant] = useState('')
    const [isStickyTabShown, setIsStickyTabShown] = useState(true)
    const [templates, setTemplates] = useState(location.state.templates)
    const [isPremium, setIsPremium] = useState(false)
    const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
    const brands = location.state.brands
    const categories = location.state.categories

    const initialState = {
        name: {old: 'Old Product Name', new: 'New Product Name', prompt: ''},
        description: {old: 'Old Product Description', new: 'New Product Description', prompt: ''},
        page_title: {old: 'Old Product Page Title', new: 'New Product Page Title', prompt: ''},
        meta_keywords: {old: 'Old Product Meta Keywords', new: 'New Product Meta Keywords', prompt: ''},
        meta_description: {old: 'Old Product Meta Description', new: 'New Product Meta Description', prompt: ''}
    }

    const [attributes, setAttributes] = useState(initialState)

    function ProductPageButton() {
        return (
            <div style={{paddingTop:'20px'}}>
                <Link className="btn-custom link-class" to='/'>
                    Back to Products
                </Link>
            </div>
            
        )
    }

    useEffect(() => {
        if (Object.keys(products).length === 0) {
            return (
                <Row>
                    <Col>No Products found in store</Col>
                    <Col><ProductPageButton/></Col>
                </Row>
            )
        }
        else {
            setSelectedProductID(Object.keys(products)[0])
        }
    }, [products])

    async function checkPremium() {
        const url = `${process.env.REACT_APP_BACKEND}/check_premium/`
        const fetchConfig = {
            credentials: "include",
            method: "GET",
        }
        const response = await fetch(url, fetchConfig)
        if (response.ok) {
            const data = await response.json()
            setIsPremium(data['premium'])
        }
    }

    useEffect(() => {
        checkPremium()
    }, [])

    useEffect(() => {
        setSaveMessage('')
        setSaveMessageVariant('')
    }, [
        filteredKeys,
        templateName,
        selectedProductID,
        selectedTemplateID,
        ])

    useEffect(() => {
        if (selectedProductID && products[selectedProductID]) {
            const newAttributes = { ...attributes }
            Object.keys(newAttributes).forEach(key => {
                newAttributes[key].old = products[selectedProductID][key] || ''
            })
            setAttributes(newAttributes)
        }}, [selectedProductID, products])

    useEffect(() => {
        if (templateSelected && selectedTemplateID && (templates[selectedTemplateID] || '')) {
            const newAttributes = { ...attributes}
            Object.keys(newAttributes).forEach(key => {
                newAttributes[key].prompt = templates[selectedTemplateID][key] || ''
            })
            setAttributes(newAttributes)
        }
    }, [templateSelected, selectedTemplateID, templates])
    
    async function getTemplates() {
        const url = `${process.env.REACT_APP_BACKEND}/product_template/`
        const fetchConfig = {
            credentials: "include",
            method: "GET",
        }
        const response = await fetch(url, fetchConfig)
        if (response.ok) {
            const data = await response.json()
            setTemplates(data['templates'])
            }
        }

    async function getAIProductData(productID, data) {
        const product = products[productID]
        const filteredProduct = {}
        for (const key of filteredKeys) {
            if (Object.keys(data).includes(key)) {
            }
            else if (key === 'brand_id') {
                filteredProduct['brand'] = brands[product['brand_id']]
            }
            else if (key === 'categories') {
                filteredProduct['categories'] = product['categories'].map((id) => categories[id])
            }
            else {
                filteredProduct[key] = product[key]
            }
        }
        data['additional_product_info'] = filteredProduct
        const dataStr = JSON.stringify(data)
        const url = `${process.env.REACT_APP_BACKEND}/get_AI_product_data/?data=${encodeURIComponent(dataStr)}`
        const fetchConfig = {
            method:'GET',
            credentials:'include'
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const newData = await response.json();
            const content = newData['new_attributes']
            setAttributes(prevAttributes => {
                const updatedAttributes = { ...prevAttributes}
                console.log('Content:', content)
                for (const key in content) {
                    if (updatedAttributes[key]) {
                        updatedAttributes[key].new = content[key].new
                    }
                }
                console.log('UPDATED ATTRIBUTES', updatedAttributes)
                return updatedAttributes
            })
            }
        } 


    function ModelToggle() {
        const handleChange = (e) => {
            const checked = e.target.checked
            if (!isPremium) {
                alert('GPT-4 is only available to premium stores.')
                return
            }
            setSelectedModel(checked ? 'gpt-4-turbo' : 'gpt-3.5-turbo')
            
        }
        return (
            <div className="model-toggle">
                <span>GPT 3.5</span>
                <Switch checked={selectedModel==='gpt-4-turbo'} onChange={handleChange} />
                <span>GPT 4</span>
            </div>
        )      
    }

    function AttributeForm(props) {
        const [localPrompt, setLocalPrompt] = useState(attributes[props.keyName].prompt)
        const handlePromptChange = (event) => {
            setLocalPrompt(event.target.value)
        }

        const handleFormSubmit = (event, keyName, updatedPrompt) => {
            event.preventDefault()
            setAttributes(prev => ({
                ...prev,
                [keyName]: {...prev[keyName], prompt: updatedPrompt}
            }))
            const data = {}
            data[keyName] = {old: attributes[keyName].old, prompt: updatedPrompt}
            console.log('DATA: ', data)
            getAIProductData(selectedProductID, data)
            setLocalPrompt(updatedPrompt)
        }

        return (
            <>
            <Col className='col-2 attribute-form-name'>
            {props.name}
            </Col>
            <Col>
                <Form className="attribute-form">
                    <Row>
                        <Col>
                            <Form.Group className ="mb-3 attribute-form-group" controlId={`formProduct${props.keyName}Prompt`}>
                                <Form.Control
                                    as="textarea"
                                    type='text'
                                    value={localPrompt}
                                    onChange={handlePromptChange}
                                    placeholder={`AI prompt for product ${props.name}`} 
                                    >
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                    <Row className='attribute-form-labels'>
                        <Col>Old {props.name}</Col>
                        <Col>New {props.name}</Col>
                    </Row>
                        <Col>
                            <Form.Group className ="mb-3" controlId={`formProduct${props.keyName}Old`}>
                                <Form.Control as="textarea" type="text" disabled placeholder={attributes[props.keyName].old}></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className ="mb-3" controlId={`formProduct${props.keyName}New`}>
                                <Form.Control as="textarea" type="text" disabled placeholder={attributes[props.keyName].new}></Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <button 
                                className="btn-custom"
                                variant='primary' 
                                onClick={(e) => handleFormSubmit(e, props.keyName, localPrompt)}>
                                Test Prompt
                            </button>
                        </Col>
                    </Row>
                </Form>
            </Col>
            </>
        )
        }

    function StickyTab() {
        const [localTemplateName, setLocalTemplateName] = useState(templateName)

        const toggleTab = () => {
            setIsStickyTabShown(!isStickyTabShown)
        }

        const handleInputChange = (event) => {
            setLocalTemplateName(event.target.value)
        }

        const handleSubmit = (e, method, name) => {
            setTemplateName(localTemplateName)
            handleTemplateSave([e, method, name])
        }
        return (
            <Container className={`sticky-tab ${isStickyTabShown ? 'shown' : 'hidden'}`}>
                <Row>
                    <Form className="sticky-tab-element" style={{paddingTop:"10px"}} controlId='formTemplateSaveName'>
                        <Form.Label>New Template Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={localTemplateName}
                            onChange={handleInputChange}
                            placeholder={templateSelected ? templates[selectedTemplateID].template_name : "Template Name"}
                            />
                    </Form>
                </Row>
                <Row>
                    <Col className="sticky-tab-element">
                        <button className="btn-custom" md={{span:2}} disabled={!templateSelected || localTemplateName.length > 0} onClick={(e) => handleSubmit(e, "PUT", templates[selectedTemplateID].template_name)}>Save Template</button>
                    </Col>  
                    <Col>
                        <button className="btn-custom" md={{span:2}} disabled={localTemplateName.length === 0} onClick={(e) => handleSubmit(e,"POST", localTemplateName)}>Create New Template</button>
                    </Col>
                </Row>
                <Row>
                    <Col className="sticky-tab-element">
                        <Alert variant={saveMessageVariant}>{saveMessage}</Alert>
                    </Col>
                </Row>
                <button onClick={toggleTab} className="toggle-button"> 
                    {isStickyTabShown ? <BoxArrowDown/> : <BoxArrowUp/>}
                </button>
            </Container>
        )
    }

    const handleTemplateSave = ([e, method, name]) => {
        saveTemplate(method, name)
        }

    async function saveTemplate(method, name) {
        console.log('In SAveTemplate')
        const url = `${process.env.REACT_APP_BACKEND}/product_template/`
        const fetchConfig = {
            method: method,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            "template_id":selectedTemplateID,
            "template_name": name,
            "name": document.getElementById("formProductnamePrompt").value,
            "description": document.getElementById("formProductdescriptionPrompt").value,
            "page_title": document.getElementById("formProductpage_titlePrompt").value,
            "meta_description": document.getElementById("formProductmeta_descriptionPrompt").value,
            "meta_keywords": document.getElementById("formProductmeta_keywordsPrompt").value,
            "additional_product_info": Array.from(document.getElementById("productInfoMultiSelect").querySelectorAll('li.selected')).map(item => item.textContent.trim())
        })}
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            setSaveMessage("Template Successfully Saved")
            setSaveMessageVariant("success")
            getTemplates()
            }
        else if (response.status === 403) {
            setSaveMessage("Unable to create Template. Template Name already in use")
            setSaveMessageVariant('warning')
        }}

    function onKeyChange(Keys) {
        const keySet = new Set(Keys)
        setFilteredKeys(keySet)
    }
    
    return (
        <>
        <Container>
            <div className="top-section">
                <ProductPageButton/>
                <Col className="title">
                    <h1>Product Template</h1>
                </Col>
                <div className="model-toggle-container">
                    <ModelToggle/>
                </div>
            </div>
            <Row>
                <Col>
                    Existing Template:
                </Col>
                <Col>
                    <Form.Group className='mb-3' controlId="formProductTemplateName">
                        <Form.Select onChange={(e) => {setTemplateSelected(e.target.value !== '0'); setSelectedTemplateID(e.target.value)}}>
                            <option key={0} value={0}>Select Existing Template</option>
                            {Object.entries(templates).map(([key, template]) => (
                                <option key={key} value={key}>{template.template_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col>
                    Test Product:
                </Col>
                <Col>
                    <Form.Group className ="mb-3" controlId='formProductSelected'>
                        <Form.Select onChange={(e) => setSelectedProductID(e.target.value)}>
                            {Object.values(products).map((product) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col>
                    Product info for template:
                </Col>
                <Col>
                <MultiSelect
                        options = {(selectedProductID) ? Object.keys(products[selectedProductID]) : [{"name":"Loading"}] }
                        isObject= {false}
                        onSelect = {onKeyChange}
                        onRemove = {onKeyChange}
                        selectedValues= {templateSelected ? JSON.parse(templates[selectedTemplateID].additional_product_info) : []}
                        displayValue = "name"
                        showCheckbox = {true}
                        closeOnSelect = {false}
                        style={{optionContainer: {maxHeight:'180px'}}}
                        id = {"productInfoMultiSelect"}
                    />
                </Col>
            </Row>
            <Row className='attribute-row first-attribute-row'>
                <AttributeForm name='Name' keyName='name'/>   
            </Row>
            <Row className='attribute-row'>
                <AttributeForm name='Description' keyName='description'/>
            </Row>
            <Row className='attribute-row'>
                <AttributeForm name='Page Title' keyName='page_title'/>
            </Row>
            <Row className='attribute-row'>
                <AttributeForm name='Meta Description' keyName='meta_description'/> 
            </Row>
            <Row className='attribute-row'>
                <AttributeForm name='Meta Keywords' keyName='meta_keywords'/>
            </Row>
            <StickyTab/>
        </Container>
        </>
    );
}

export default ProductTemplate;